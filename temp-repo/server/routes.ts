import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, generateUsernames } from "./storage";
import { generateRequestSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";
import { spawn } from "child_process";

const checkUsernameSchema = z.object({
  username: z.string().min(2).max(32),
});

const lastCheckTimes: Map<string, number> = new Map();
const MIN_CHECK_INTERVAL = 1000;

import { spawn } from "child_process";

async function checkDiscordUsername(username: string): Promise<{ available: boolean; error?: string }> {
  return new Promise((resolve) => {
    const python = spawn('python3', [
      'check_username.py',
      username
    ]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        resolve({ available: false, error: "Check failed" });
        return;
      }

      try {
        const result = JSON.parse(output.trim());
        resolve({ 
          available: result.available || false,
          error: result.error
        });
      } catch {
        // Parse text output
        const isAvailable = output.toLowerCase().includes('available') || 
                          output.toLowerCase().includes('متاح');
        resolve({ available: isAvailable });
      }
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      python.kill();
      resolve({ available: false, error: "Timeout" });
    }, 5000);
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/generate", async (req, res) => {
    try {
      const parsed = generateRequestSchema.parse(req.body);
      const usernames = generateUsernames(
        parsed.type,
        parsed.includeLetters,
        parsed.includeNumbers,
        parsed.count
      );
      res.json({ usernames });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request", details: error.errors });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.post("/api/check", async (req, res) => {
    try {
      const parsed = checkUsernameSchema.parse(req.body);
      const username = parsed.username.toLowerCase();
      
      const clientId = req.ip || "unknown";
      const lastCheck = lastCheckTimes.get(clientId) || 0;
      const now = Date.now();
      
      if (now - lastCheck < MIN_CHECK_INTERVAL) {
        res.status(429).json({ 
          error: "Too many requests", 
          retryAfter: MIN_CHECK_INTERVAL - (now - lastCheck) 
        });
        return;
      }
      
      lastCheckTimes.set(clientId, now);
      
      const result = await checkDiscordUsername(username);
      const checkedAt = new Date().toISOString();
      
      const checkRecord = {
        id: randomUUID(),
        username,
        type: username.length === 3 ? "three" as const : 
              username.length === 4 ? "four" as const : "semiThree" as const,
        status: result.available ? "available" as const : "taken" as const,
        checkedAt,
      };
      
      await storage.addCheck(checkRecord);
      
      const currentStats = await storage.getStats();
      await storage.updateStats({
        totalChecks: currentStats.totalChecks + 1,
        availableCount: result.available ? currentStats.availableCount + 1 : currentStats.availableCount,
        unavailableCount: result.available ? currentStats.unavailableCount : currentStats.unavailableCount + 1,
        checksToday: currentStats.checksToday + 1,
        startTime: currentStats.startTime || checkedAt,
      });
      
      res.json({ 
        username, 
        available: result.available,
        error: result.error,
        checkedAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request", details: error.errors });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/available", async (_req, res) => {
    try {
      const available = await storage.getAvailableUsernames();
      res.json({ usernames: available });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/checks", async (_req, res) => {
    try {
      const checks = await storage.getChecks();
      res.json({ checks });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/checks", async (_req, res) => {
    try {
      await storage.clearChecks();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, generateUsernames } from "./storage";
import { generateRequestSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";
import { HttpsProxyAgent } from "https-proxy-agent";
import nodeFetch from "node-fetch";

const checkUsernameSchema = z.object({
  username: z.string().min(2).max(32),
});

const lastCheckTimes: Map<string, number> = new Map();
const MIN_CHECK_INTERVAL = 1000;

interface ProxyInfo {
  ip: string;
  port: string;
  type: string;
}

let cachedProxy: ProxyInfo | null = null;
let proxyLastFetched = 0;
const PROXY_CACHE_DURATION = 5 * 60 * 1000;

async function getProxy(): Promise<ProxyInfo | null> {
  const now = Date.now();
  if (cachedProxy && now - proxyLastFetched < PROXY_CACHE_DURATION) {
    return cachedProxy;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await nodeFetch(
      "http://pubproxy.com/api/proxy?format=json&type=http&https=true&level=elite&limit=1",
      { signal: controller.signal as any }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json() as { data: Array<{ ip: string; port: string; type: string }> };
      if (data.data && data.data.length > 0) {
        cachedProxy = {
          ip: data.data[0].ip,
          port: data.data[0].port,
          type: data.data[0].type,
        };
        proxyLastFetched = now;
        console.log(`[proxy] Using proxy: ${cachedProxy.ip}:${cachedProxy.port}`);
        return cachedProxy;
      }
    }
  } catch (error) {
    console.log("[proxy] Failed to fetch proxy, using direct connection");
  }
  return null;
}

async function checkDiscordUsername(username: string): Promise<{ available: boolean; error?: string }> {
  try {
    const apiUrl = "https://discord.com/api/v9/unique-username/username-attempt-unauthed";
    const proxy = await getProxy();
    
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
    
    const body = JSON.stringify({ username: username.toLowerCase() });
    
    let response;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    if (proxy) {
      const proxyUrl = `http://${proxy.ip}:${proxy.port}`;
      const agent = new HttpsProxyAgent(proxyUrl);
      
      try {
        response = await nodeFetch(apiUrl, {
          method: "POST",
          headers,
          body,
          agent,
          signal: controller.signal as any,
        });
      } catch (proxyError) {
        console.log("[proxy] Proxy request failed, trying direct connection");
        cachedProxy = null;
        response = await nodeFetch(apiUrl, {
          method: "POST",
          headers,
          body,
          signal: controller.signal as any,
        });
      }
    } else {
      response = await nodeFetch(apiUrl, {
        method: "POST",
        headers,
        body,
        signal: controller.signal as any,
      });
    }
    
    clearTimeout(timeoutId);

    if (response.status === 429) {
      cachedProxy = null;
      return { available: false, error: "Rate limited - trying new proxy" };
    }

    if (response.ok) {
      const data = await response.json() as { taken: boolean };
      return { available: !data.taken };
    }
    
    return { available: false, error: `HTTP ${response.status}` };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { available: false, error: "Timeout - try again" };
    }
    return { 
      available: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
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
        parsed.count,
        parsed.prefix || ""
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

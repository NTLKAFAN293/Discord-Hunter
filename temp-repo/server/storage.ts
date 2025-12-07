import { randomUUID } from "crypto";
import type { UsernameCheck, CheckSettings, SessionStats, UsernameType } from "@shared/schema";

export interface IStorage {
  addCheck(check: UsernameCheck): Promise<UsernameCheck>;
  getChecks(): Promise<UsernameCheck[]>;
  getAvailableUsernames(): Promise<UsernameCheck[]>;
  clearChecks(): Promise<void>;
  getStats(): Promise<SessionStats>;
  updateStats(stats: Partial<SessionStats>): Promise<SessionStats>;
}

export class MemStorage implements IStorage {
  private checks: Map<string, UsernameCheck>;
  private stats: SessionStats;

  constructor() {
    this.checks = new Map();
    this.stats = {
      totalChecks: 0,
      availableCount: 0,
      unavailableCount: 0,
      startTime: undefined,
      checksToday: 0,
    };
  }

  async addCheck(check: UsernameCheck): Promise<UsernameCheck> {
    const id = check.id || randomUUID();
    const newCheck = { ...check, id };
    this.checks.set(id, newCheck);
    return newCheck;
  }

  async getChecks(): Promise<UsernameCheck[]> {
    return Array.from(this.checks.values());
  }

  async getAvailableUsernames(): Promise<UsernameCheck[]> {
    return Array.from(this.checks.values()).filter(
      (check) => check.status === "available"
    );
  }

  async clearChecks(): Promise<void> {
    this.checks.clear();
    this.stats = {
      totalChecks: 0,
      availableCount: 0,
      unavailableCount: 0,
      startTime: undefined,
      checksToday: 0,
    };
  }

  async getStats(): Promise<SessionStats> {
    return { ...this.stats };
  }

  async updateStats(updates: Partial<SessionStats>): Promise<SessionStats> {
    this.stats = { ...this.stats, ...updates };
    return { ...this.stats };
  }
}

export const storage = new MemStorage();

const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";

function getCharPool(includeLetters: boolean, includeNumbers: boolean): string {
  let pool = "";
  if (includeLetters) pool += LETTERS;
  if (includeNumbers) pool += NUMBERS;
  return pool || LETTERS;
}

function randomChar(pool: string): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateUsername(
  type: UsernameType,
  includeLetters: boolean,
  includeNumbers: boolean
): string {
  const pool = getCharPool(includeLetters, includeNumbers);
  
  switch (type) {
    case "three":
      return randomChar(pool) + randomChar(pool) + randomChar(pool);
    case "four":
      return randomChar(pool) + randomChar(pool) + randomChar(pool) + randomChar(pool);
    case "semiThree":
      if (includeLetters && includeNumbers) {
        const letters = LETTERS;
        const numbers = NUMBERS;
        return randomChar(letters) + randomChar(letters) + randomChar(numbers);
      }
      return randomChar(pool) + randomChar(pool) + randomChar(pool);
    default:
      return randomChar(pool) + randomChar(pool) + randomChar(pool);
  }
}

export function generateUsernames(
  type: UsernameType,
  includeLetters: boolean,
  includeNumbers: boolean,
  count: number
): string[] {
  const usernames: string[] = [];
  const seen = new Set<string>();
  
  for (let i = 0; i < count && usernames.length < count; i++) {
    const username = generateUsername(type, includeLetters, includeNumbers);
    if (!seen.has(username)) {
      seen.add(username);
      usernames.push(username);
    }
  }
  
  return usernames;
}

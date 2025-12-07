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
  includeNumbers: boolean,
  prefix: string = ""
): string {
  const pool = getCharPool(includeLetters, includeNumbers);
  const prefixLength = prefix.length;
  
  switch (type) {
    case "three": {
      const remaining = 3 - prefixLength;
      if (remaining <= 0) return prefix.slice(0, 3);
      let result = prefix;
      for (let i = 0; i < remaining; i++) {
        result += randomChar(pool);
      }
      return result;
    }
    case "four": {
      const remaining = 4 - prefixLength;
      if (remaining <= 0) return prefix.slice(0, 4);
      let result = prefix;
      for (let i = 0; i < remaining; i++) {
        result += randomChar(pool);
      }
      return result;
    }
    case "semiThree": {
      const separator = Math.random() < 0.5 ? '_' : '.';
      const baseLength = 3 - prefixLength;
      if (baseLength <= 0) {
        return prefix.slice(0, 2) + separator + prefix.slice(2, 3);
      }
      let base = prefix;
      for (let i = 0; i < baseLength; i++) {
        base += randomChar(pool);
      }
      const position = Math.floor(Math.random() * 3) + 1;
      const chars = base.split('');
      chars.splice(position, 0, separator);
      return chars.join('');
    }
    default: {
      const remaining = 3 - prefixLength;
      if (remaining <= 0) return prefix.slice(0, 3);
      let result = prefix;
      for (let i = 0; i < remaining; i++) {
        result += randomChar(pool);
      }
      return result;
    }
  }
}

export function generateUsernames(
  type: UsernameType,
  includeLetters: boolean,
  includeNumbers: boolean,
  count: number,
  prefix: string = ""
): string[] {
  const usernames: string[] = [];
  const seen = new Set<string>();
  const maxAttempts = count * 10;
  let attempts = 0;
  
  while (usernames.length < count && attempts < maxAttempts) {
    const username = generateUsername(type, includeLetters, includeNumbers, prefix);
    if (!seen.has(username)) {
      seen.add(username);
      usernames.push(username);
    }
    attempts++;
  }
  
  return usernames;
}

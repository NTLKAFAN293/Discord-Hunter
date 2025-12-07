import { z } from "zod";

export const usernameTypeEnum = z.enum(["three", "four", "semiThree"]);
export type UsernameType = z.infer<typeof usernameTypeEnum>;

export const usernameStatusEnum = z.enum(["pending", "checking", "available", "taken"]);
export type UsernameStatus = z.infer<typeof usernameStatusEnum>;

export const usernameCheckSchema = z.object({
  id: z.string(),
  username: z.string(),
  type: usernameTypeEnum,
  status: usernameStatusEnum,
  checkedAt: z.string().optional(),
});

export type UsernameCheck = z.infer<typeof usernameCheckSchema>;

export const checkSettingsSchema = z.object({
  usernameTypes: z.array(usernameTypeEnum).min(1),
  includeLetters: z.boolean().default(true),
  includeNumbers: z.boolean().default(true),
  delayMs: z.number().min(1000).max(10000).default(3000),
  dailyLimit: z.number().min(10).max(500).default(100),
});

export type CheckSettings = z.infer<typeof checkSettingsSchema>;

export const sessionStatsSchema = z.object({
  totalChecks: z.number().default(0),
  availableCount: z.number().default(0),
  unavailableCount: z.number().default(0),
  startTime: z.string().optional(),
  checksToday: z.number().default(0),
});

export type SessionStats = z.infer<typeof sessionStatsSchema>;

export const checkResponseSchema = z.object({
  username: z.string(),
  available: z.boolean(),
  error: z.string().optional(),
});

export type CheckResponse = z.infer<typeof checkResponseSchema>;

export const generateRequestSchema = z.object({
  type: usernameTypeEnum,
  includeLetters: z.boolean(),
  includeNumbers: z.boolean(),
  count: z.number().min(1).max(10).default(1),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

import { z } from "zod";

// Define roles
export const roles = [
  "admin",
  "investigator",
  "auditor",
  "officer-critical",
  "officer-high",
  "officer-medium",
  "officer-low",
] as const;
export type Role = typeof roles[number];

// Define clearance levels
export const clearanceLevels = ["low", "medium", "high", "critical"] as const;
export type ClearanceLevel = typeof clearanceLevels[number];

// Define user schema
export const userSchema = z.object({
  id: z.number().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  name: z.string(),
  role: z.enum(roles),
  clearance: z.enum(clearanceLevels).default("low"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type User = z.infer<typeof userSchema>;
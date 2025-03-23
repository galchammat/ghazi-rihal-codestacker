// filepath: /home/user/code/ghazi-rihal-codestacker/packages/backend/src/schemas/userSchema.ts
import { z } from "zod";

export const roles = [
  "admin",
  "investigator",
  "officer-critical",
  "officer-high",
  "officer-medium",
  "officer-low",
] as const;

export type Role = typeof roles[number];

export const userSchema = z.object({
  id: z.number().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  name: z.string(),
  role: z.enum(roles),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof userSchema>;
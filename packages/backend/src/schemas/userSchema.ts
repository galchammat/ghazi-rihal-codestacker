// filepath: /home/user/code/ghazi-rihal-codestacker/packages/backend/src/schemas/userSchema.ts
import { z } from "zod";

export const userSchema = z.object({
  id: z.number().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof userSchema>;
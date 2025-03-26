import { z } from "zod";
import { clearanceLevels } from "./userSchema";

export const caseSchema = z.object({
  id: z.number().int().positive().optional(),
  case_name: z.string().min(1, "Case name is required"),
  description: z.string().min(1, "Description is required"),
  area: z.string().min(1, "Area is required"),
  city: z.string().min(1, "City is required"),
  created_by: z.number().int().positive(),
  type: z.string().min(1, "Type is required"),
  clearance: z.enum(clearanceLevels).default("critical"),
  status: z.string().default("pending"),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Case = z.infer<typeof caseSchema>;

export const caseStatusOptions = ["pending", "ongoing", "closed"];
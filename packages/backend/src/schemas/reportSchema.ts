import { z } from "zod";

export const reportSchema = z.object({
  id: z.number().int().positive().optional(),
  email: z.string().email("Invalid email address"),
  civil_id: z.string().min(1, "Civil ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  area: z.string().min(1, "Area is required"),
  city: z.string().min(1, "City is required"),
  caseId: z.number().int().positive().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Report = z.infer<typeof reportSchema>;
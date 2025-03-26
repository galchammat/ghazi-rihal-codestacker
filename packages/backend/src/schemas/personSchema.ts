import { z } from "zod";

export const personSchema = z.object({
  type: z.enum(["suspect", "victim", "witness"]).describe("Type of person (suspect, victim, witness)"),
  name: z.string().min(1, "Name is required"),
  age: z.number().int().min(0, "Age must be a positive integer"),
  gender: z.enum(["male", "female", "other"]).describe("Gender of the person"),
  role: z.string().min(1, "Role is required"),
});

export const personUpdateSchema = personSchema.partial();
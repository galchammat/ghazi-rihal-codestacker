import { z } from "zod";

export const assignmentRequestSchema = z.object({
  params: z.object({
    caseId: z.preprocess((val) => Number(val), z.number().int().positive("Case ID must be a positive integer.")),
  }),
  body: z.object({
    userId: z.number().int().positive("User ID must be a positive integer."),
  }),
});

export type AssignmentRequest = z.infer<typeof assignmentRequestSchema>;
import { z } from "zod";

export const commentSchema = z.object({
  content: z
    .string()
    .min(5, "Comment must be at least 5 characters long.")
    .max(150, "Comment cannot exceed 150 characters.")
    .regex(
      /^[a-zA-Z0-9\s.,!?'"()-]+$/,
      "Comment contains invalid characters. Please use only letters, numbers, and basic punctuation."
    )
    .refine((content) => !/<\/?[a-z][\s\S]*>/i.test(content), {
      message: "HTML tags are not allowed in comments.",
    }),
});
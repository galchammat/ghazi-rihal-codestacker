import { z } from "zod";

export const evidenceSchema = z
  .object({
    type: z.enum(["text", "image"]).describe("Evidence type must be either 'text' or 'image'"),
    content: z.string().min(1, "Content is required"),
    remarks: z.string().optional(),
    deleted: z.boolean().optional(), // Managed internally for soft deletes
  })
  .superRefine((data, ctx) => {
    if (data.type === "image") {
      // Validate Base64-encoded image
      const isBase64Image = /^data:image\/(jpeg|png|gif|bmp|webp);base64,/.test(data.content);
      if (!isBase64Image) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "Invalid content. Must be a valid Base64-encoded image.",
        });
      }
    } else if (data.type === "text") {
      // Validate byte-encoded string (basic validation for non-empty string)
      if (!/^[\x00-\xFF]+$/.test(data.content)) { // Checks for valid byte characters
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "Invalid content. Must be a valid byte-encoded string.",
        });
      }
    }
  });
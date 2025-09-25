import { z } from "zod";

export const newsQuerySchema = z.object({
  topic: z.string().optional(),
  bookmark: z
    .string()
    .transform((value) => value === "true")
    .optional()
});

export const bookmarkPayloadSchema = z.object({
  isBookmarked: z.boolean()
});

export type BookmarkPayload = z.infer<typeof bookmarkPayloadSchema>;

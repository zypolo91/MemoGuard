import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "Date must be in YYYY-MM-DD format");

export const memoryMediaInputSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["image", "video", "audio", "file"]),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  altText: z.string().max(160).optional()
});

export const memoryPayloadSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1),
  richText: z.string().optional(),
  eventDate: dateString,
  mood: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).default([]),
  media: z.array(memoryMediaInputSchema).default([]),
  people: z.array(z.string()).default([])
});

export const memoryUpdateSchema = memoryPayloadSchema.partial();

export const memoryQuerySchema = z.object({
  tag: z.string().optional(),
  from: dateString.optional(),
  to: dateString.optional()
});

export type MemoryPayload = z.infer<typeof memoryPayloadSchema>;
export type MemoryUpdatePayload = z.infer<typeof memoryUpdateSchema>;

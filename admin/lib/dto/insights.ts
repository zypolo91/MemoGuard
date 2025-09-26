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

export const articleCreateSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(180),
  source: z.string().trim().max(120).optional().or(z.literal("")),
  summary: z.string().trim().optional().or(z.literal("")),
  topic: z.string().trim().max(64).optional().or(z.literal("")),
  contentUrl: z.string().url("链接格式不正确").optional().or(z.literal("")),
  publishedAt: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
});

export const articleUpdateSchema = articleCreateSchema.partial();

export type ArticleCreatePayload = z.infer<typeof articleCreateSchema>;
export type ArticleUpdatePayload = z.infer<typeof articleUpdateSchema>;

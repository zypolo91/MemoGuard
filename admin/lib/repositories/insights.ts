import { and, eq, ilike } from "drizzle-orm";
import { insightArticles } from "../schema/insights";
import { getDb } from "../utils/db";
import { createId } from "@/lib/utils/id";

export async function listInsightArticles(params: { topic?: string; bookmark?: boolean }) {
  const db = getDb();
  return db.query.insightArticles.findMany({
    where: (fields, operators) => {
      const expressions = [] as unknown[];
      if (params.topic) {
        expressions.push(ilike(fields.topic, `%${params.topic}%`));
      }
      if (params.bookmark !== undefined) {
        expressions.push(eq(fields.isBookmarked, params.bookmark));
      }
      if (!expressions.length) return undefined;
      return expressions.length === 1 ? (expressions[0] as any) : and(...(expressions as any));
    },
    orderBy: (fields, { desc }) => desc(fields.createdAt)
  });
}

export async function updateBookmark(id: string, isBookmarked: boolean) {
  const db = getDb();
  await db
    .update(insightArticles)
    .set({ isBookmarked })
    .where(eq(insightArticles.id, id));
  return db.query.insightArticles.findFirst({
    where: (fields, operators) => operators.eq(fields.id, id)
  });
}

export interface CreateArticleInput {
  title: string;
  source?: string | null;
  summary?: string | null;
  topic?: string | null;
  contentUrl?: string | null;
  publishedAt?: string | null;
}

export async function createInsightArticle(input: CreateArticleInput) {
  const db = getDb();
  const id = createId();
  await db.insert(insightArticles).values({
    id,
    title: input.title,
    source: input.source || null,
    summary: input.summary || null,
    topic: input.topic || null,
    contentUrl: input.contentUrl || null,
    publishedAt: input.publishedAt ? new Date(input.publishedAt) : null
  });
  return db.query.insightArticles.findFirst({
    where: (fields, operators) => operators.eq(fields.id, id)
  });
}

export async function updateInsightArticle(id: string, input: Partial<CreateArticleInput>) {
  const db = getDb();
  await db
    .update(insightArticles)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.source !== undefined ? { source: input.source || null } : {}),
      ...(input.summary !== undefined ? { summary: input.summary || null } : {}),
      ...(input.topic !== undefined ? { topic: input.topic || null } : {}),
      ...(input.contentUrl !== undefined ? { contentUrl: input.contentUrl || null } : {}),
      ...(input.publishedAt !== undefined
        ? { publishedAt: input.publishedAt ? new Date(input.publishedAt) : null }
        : {})
    })
    .where(eq(insightArticles.id, id));
  return db.query.insightArticles.findFirst({ where: (f, o) => o.eq(f.id, id) });
}

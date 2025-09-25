import { and, eq, ilike } from "drizzle-orm";
import { insightArticles } from "../schema/insights";
import { getDb } from "../utils/db";

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

import { NextRequest } from "next/server";
import { articleCreateSchema, newsQuerySchema } from "@/lib/dto/insights";
import { createInsightArticle, listInsightArticles } from "@/lib/repositories/insights";
import { jsonCreated, jsonError, jsonOk } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = newsQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return jsonError(400, "invalid_query", parsed.error.errors.map((issue) => issue.message).join("; "));
    }
    const data = await listInsightArticles(parsed.data);
    return jsonOk(data);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取资讯列表失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = articleCreateSchema.safeParse(json);
    if (!parsed.success) {
      return jsonError(400, "invalid_payload", parsed.error.errors.map((i) => i.message).join("; "));
    }
    const payload = parsed.data;
    const record = await createInsightArticle({
      title: payload.title,
      source: payload.source || undefined,
      summary: payload.summary || undefined,
      topic: payload.topic || undefined,
      contentUrl: payload.contentUrl || undefined,
      publishedAt: payload.publishedAt || undefined
    });
    return jsonCreated(record);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "创建资讯失败");
  }
}

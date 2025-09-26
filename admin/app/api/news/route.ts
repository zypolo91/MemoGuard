import { NextRequest } from "next/server";
import { newsQuerySchema } from "@/lib/dto/insights";
import { listInsightArticles } from "@/lib/repositories/insights";
import { jsonError, jsonOk } from "@/lib/utils/http";

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

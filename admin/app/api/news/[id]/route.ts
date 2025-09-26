import { NextRequest } from "next/server";
import { articleUpdateSchema } from "@/lib/dto/insights";
import { updateInsightArticle } from "@/lib/repositories/insights";
import { jsonError, jsonOk } from "@/lib/utils/http";

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const id = context.params.id;
    const json = await request.json();
    const parsed = articleUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return jsonError(400, "invalid_payload", parsed.error.errors.map((i) => i.message).join("; "));
    }

    const updated = await updateInsightArticle(id, {
      title: parsed.data.title || undefined,
      source: parsed.data.source || undefined,
      summary: parsed.data.summary || undefined,
      topic: parsed.data.topic || undefined,
      contentUrl: parsed.data.contentUrl || undefined,
      publishedAt: parsed.data.publishedAt || undefined
    });

    if (!updated) return jsonError(404, "not_found", "记录不存在");
    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "更新资讯失败");
  }
}
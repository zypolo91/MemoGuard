import { NextRequest } from "next/server";
import { bookmarkPayloadSchema } from "@/lib/dto/insights";
import { updateBookmark } from "@/lib/repositories/insights";
import { jsonError, jsonOk } from "@/lib/utils/http";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const payload = bookmarkPayloadSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const updated = await updateBookmark(context.params.id, payload.data.isBookmarked);
    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "更新资讯收藏状态失败");
  }
}

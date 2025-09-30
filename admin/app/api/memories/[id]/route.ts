import { NextRequest } from "next/server";
import { memoryUpdateSchema } from "@/lib/dto/memories";
import { deleteMemory, getMemory, updateMemory } from "@/lib/repositories/memories";
import { jsonError, jsonNoContent, jsonOk } from "@/lib/utils/http";
import { getActiveAdmin } from "@/lib/auth/session";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "请先登录");
    const record = await getMemory(me.id, context.params.id);
    if (!record) {
      return jsonError(404, "not_found", "记忆不存在");
    }
    return jsonOk(record);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "查询记忆失败");
  }
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const payload = memoryUpdateSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "请先登录");
    const updated = await updateMemory(me.id, context.params.id, payload.data);
    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "更新记忆失败");
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "请先登录");
    await deleteMemory(me.id, context.params.id);
    return jsonNoContent();
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "删除记忆失败");
  }
}


import { NextRequest } from "next/server";
import { taskUpdateSchema } from "@/lib/dto/tasks";
import { deleteTask, getTask, updateTask } from "@/lib/repositories/tasks";
import { jsonError, jsonNoContent, jsonOk } from "@/lib/utils/http";
import { getActiveAdmin } from "@/lib/auth/session";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "请先登录");
    const task = await getTask(me.id, context.params.id);
    if (!task) {
      return jsonError(404, "not_found", "任务不存在");
    }
    return jsonOk(task);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取任务失败");
  }
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const payload = taskUpdateSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "请先登录");
    const updated = await updateTask(me.id, context.params.id, payload.data);
    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "更新任务失败");
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "请先登录");
    await deleteTask(me.id, context.params.id);
    return jsonNoContent();
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "删除任务失败");
  }
}


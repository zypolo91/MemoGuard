import { NextRequest } from "next/server";
import { reminderPayloadSchema, taskPayloadSchema } from "@/lib/dto/tasks";
import { createTask, listTasks } from "@/lib/repositories/tasks";
import { jsonCreated, jsonError, jsonOk } from "@/lib/utils/http";
import { getActiveAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "请先登录");
    const tasks = await listTasks(me.id);
    return jsonOk(tasks);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取任务列表失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "请先登录");
    const body = await request.json();
    const payload = taskPayloadSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const created = await createTask(me.id, payload.data);
    return jsonCreated(created);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "创建任务失败");
  }
}


import { NextRequest } from "next/server";
import { reminderPayloadSchema, taskPayloadSchema } from "@/lib/dto/tasks";
import { createTask, listTasks } from "@/lib/repositories/tasks";
import { jsonCreated, jsonError, jsonOk } from "@/lib/utils/http";

export async function GET() {
  try {
    const tasks = await listTasks();
    return jsonOk(tasks);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取护理任务失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = taskPayloadSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const created = await createTask(payload.data);
    return jsonCreated(created);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "创建护理任务失败");
  }
}

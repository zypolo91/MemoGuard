import { NextRequest } from "next/server";
import { reminderPayloadSchema } from "@/lib/dto/tasks";
import { addReminder } from "@/lib/repositories/tasks";
import { jsonCreated, jsonError } from "@/lib/utils/http";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const payload = reminderPayloadSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const updated = await addReminder(context.params.id, payload.data);
    return jsonCreated(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "创建提醒失败");
  }
}

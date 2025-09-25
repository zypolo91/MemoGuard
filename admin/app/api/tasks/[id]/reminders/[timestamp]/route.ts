import { NextRequest } from "next/server";
import { reminderPayloadSchema } from "@/lib/dto/tasks";
import { deleteReminder, updateReminder } from "@/lib/repositories/tasks";
import { jsonError, jsonNoContent, jsonOk } from "@/lib/utils/http";

const reminderPatchSchema = reminderPayloadSchema.partial();

export async function PATCH(request: NextRequest, context: { params: { id: string; timestamp: string } }) {
  try {
    const body = await request.json();
    const payload = reminderPatchSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const updated = await updateReminder(context.params.id, decodeURIComponent(context.params.timestamp), payload.data);
    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "更新提醒失败");
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string; timestamp: string } }) {
  try {
    await deleteReminder(context.params.id, decodeURIComponent(context.params.timestamp));
    return jsonNoContent();
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "删除提醒失败");
  }
}

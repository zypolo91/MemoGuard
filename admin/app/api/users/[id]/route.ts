import { NextRequest } from "next/server";
import { userUpdateSchema } from "@/lib/dto/users";
import { deleteUser, getUser, updateUser } from "@/lib/repositories/users";
import { jsonError, jsonNoContent, jsonOk } from "@/lib/utils/http";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const record = await getUser(context.params.id);
    if (!record) {
      return jsonError(404, "not_found", "用户不存在");
    }
    return jsonOk(record);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取用户失败");
  }
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(422, "validation_error", parsed.error.errors.map((issue) => issue.message).join("; "));
    }
    const updated = await updateUser(context.params.id, parsed.data);
    if (!updated) {
      return jsonError(404, "not_found", "用户不存在");
    }
    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "更新用户失败");
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  try {
    await deleteUser(context.params.id);
    return jsonNoContent();
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "删除用户失败");
  }
}

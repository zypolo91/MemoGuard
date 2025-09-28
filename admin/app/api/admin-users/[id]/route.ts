import { NextRequest } from "next/server";
import { getActiveAdmin } from "@/lib/auth/session";
import { adminUserUpdateSchema } from "@/lib/dto/admin-users";
import { deleteAdminUser, getAdminUser, updateAdminUser } from "@/lib/repositories/admin-users";
import { jsonError, jsonNoContent, jsonOk } from "@/lib/utils/http";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "未登录");

    const record = await getAdminUser(context.params.id);
    if (!record) {
      return jsonError(404, "not_found", "管理员不存在");
    }
    return jsonOk(record);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取管理员失败");
  }
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "未登录");
    if (me.role !== "superadmin") return jsonError(403, "forbidden", "仅超级管理员可修改管理员");

    const body = await request.json();
    const parsed = adminUserUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(422, "validation_error", parsed.error.errors.map((issue) => issue.message).join("; "));
    }
    const updated = await updateAdminUser(context.params.id, parsed.data);
    if (!updated) {
      return jsonError(404, "not_found", "管理员不存在");
    }
    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "更新管理员失败");
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "未登录");
    if (me.role !== "superadmin") return jsonError(403, "forbidden", "仅超级管理员可删除管理员");
    if (me.id === context.params.id) return jsonError(409, "cannot_delete_self", "不能删除自己");

    await deleteAdminUser(context.params.id);
    return jsonNoContent();
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "删除管理员失败");
  }
}
import { NextRequest } from "next/server";
import { getActiveAdmin } from "@/lib/auth/session";
import { adminUserCreateSchema, adminUserQuerySchema } from "@/lib/dto/admin-users";
import { createAdminUser, listAdminUsers } from "@/lib/repositories/admin-users";
import { jsonCreated, jsonError, jsonOk } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "未登录");

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = adminUserQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return jsonError(400, "invalid_query", parsed.error.errors.map((issue) => issue.message).join("; "));
    }
    const result = await listAdminUsers(parsed.data);
    return jsonOk(result);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取管理员列表失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "未登录");
    if (me.role !== "superadmin") return jsonError(403, "forbidden", "仅超级管理员可创建管理员");

    const body = await request.json();
    const parsed = adminUserCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(422, "validation_error", parsed.error.errors.map((issue) => issue.message).join("; "));
    }
    const created = await createAdminUser(parsed.data);
    return jsonCreated(created);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "创建管理员失败");
  }
}

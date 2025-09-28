import { NextRequest } from "next/server";
import { jsonCreated, jsonError } from "@/lib/utils/http";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/schema";
import { createId } from "@/lib/utils/id";
import { hashPassword } from "@/lib/utils/password";

export async function POST(req: NextRequest) {
  try {
    if (!db) return jsonError(500, "db_not_ready", "数据库未初始化");
    const exists = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
    if (exists.length > 0) {
      return jsonError(409, "already_initialized", "系统已初始化管理员");
    }

    const body = await req.json().catch(() => ({}));
    const { username, password, displayName, email } = body ?? {};
    if (!username || !password) return jsonError(400, "invalid_payload", "用户名和密码不能为空");

    const id = createId();
    await db.insert(adminUsers).values({
      id,
      username,
      passwordHash: hashPassword(password),
      displayName: displayName ?? username,
      email: email ?? null,
      role: "superadmin"
    });

    return jsonCreated({ id, username });
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "创建超级管理员失败");
  }
}

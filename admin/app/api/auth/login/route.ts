import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/utils/password";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    if (!db) return jsonError(500, "db_not_ready", "数据库未初始化");
    const { username, password } = (await req.json().catch(() => ({}))) as {
      username?: string;
      password?: string;
    };
    if (!username || !password) return jsonError(400, "invalid_payload", "用户名和密码不能为空");

    const record = await db.query.adminUsers.findFirst({ where: (f, o) => o.eq(f.username, username) });
    if (!record) return jsonError(401, "invalid_credentials", "用户名或密码错误");
    if (!verifyPassword(password, record.passwordHash)) return jsonError(401, "invalid_credentials", "用户名或密码错误");

    setSessionCookie(record.id, record.role);

    // update last login
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, record.id));

    return jsonOk({ id: record.id, role: record.role, displayName: record.displayName ?? record.username });
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "登录失败");
  }
}

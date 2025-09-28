import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken, signAdminToken } from "./token";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "mg_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function getActiveAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyAdminToken(token);
  if (!payload) return null;
  if (!db) return null;
  const record = await db.query.adminUsers.findFirst({
    where: (fields, operators) => operators.eq(fields.id, payload.sub)
  });
  if (!record) return null;
  return { id: record.id, role: record.role, username: record.username, displayName: record.displayName } as const;
}

export function setSessionCookie(adminId: string, role: string) {
  const cookieStore = cookies();
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const token = signAdminToken({ sub: adminId, role, exp });
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
}

export async function requireAdminOrRedirect() {
  const me = await getActiveAdmin();
  if (me) return me;
  // if no admin user, redirect to bootstrap register page
  if (!db) redirect("/auth/login");
  const count = await db.select({ c: adminUsers.id }).from(adminUsers).limit(1);
  if (count.length === 0) {
    redirect("/auth/register-super");
  }
  redirect("/auth/login");
}

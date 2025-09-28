import { jsonOk } from "@/lib/utils/http";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/schema";

export async function GET() {
  if (!db) return jsonOk({ hasAdmin: false });
  const rows = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
  return jsonOk({ hasAdmin: rows.length > 0 });
}

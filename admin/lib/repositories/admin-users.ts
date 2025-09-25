import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { adminUsers } from "../schema/users";
import { getDb } from "../utils/db";
import { createId } from "../utils/id";
import { hashPassword } from "../utils/password";
import type {
  AdminUserCreatePayload,
  AdminUserQuery,
  AdminUserUpdatePayload
} from "../dto/admin-users";

type AdminUserRecord = typeof adminUsers.$inferSelect;

type SanitizedAdminUser = Omit<AdminUserRecord, "passwordHash">;

function sanitize(record: AdminUserRecord | null): SanitizedAdminUser | null {
  if (!record) {
    return null;
  }
  const { passwordHash: _passwordHash, ...rest } = record;
  return rest;
}

function buildFilters(query: AdminUserQuery): SQL | undefined {
  const filters: SQL[] = [];

  if (query.role) {
    filters.push(eq(adminUsers.role, query.role));
  }
  if (query.status) {
    filters.push(eq(adminUsers.status, query.status));
  }
  if (query.search) {
    const pattern = `%${query.search}%`;
    filters.push(
      or(
        ilike(adminUsers.username, pattern),
        ilike(adminUsers.displayName, pattern),
        ilike(adminUsers.email, pattern)
      )
    );
  }

  if (!filters.length) {
    return undefined;
  }
  return filters.length === 1 ? filters[0] : and(...filters);
}

export async function listAdminUsers(query: AdminUserQuery = {}) {
  const db = getDb();
  const pageSize = query.pageSize ?? 20;
  const page = query.page ?? 1;
  const offset = (page - 1) * pageSize;
  const whereClause = buildFilters(query) ?? sql`true`;

  const [items, totalRow] = await Promise.all([
    db
      .select()
      .from(adminUsers)
      .where(whereClause)
      .orderBy(desc(adminUsers.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(adminUsers)
      .where(whereClause)
  ]);

  const total = Number(totalRow[0]?.count ?? 0);

  return {
    data: items.map((item) => sanitize(item)!),
    pagination: {
      page,
      pageSize,
      total
    }
  };
}

export async function createAdminUser(payload: AdminUserCreatePayload) {
  const db = getDb();
  const id = createId();
  const passwordHash = hashPassword(payload.password);

  await db.insert(adminUsers).values({
    id,
    username: payload.username,
    passwordHash,
    displayName: payload.displayName,
    email: payload.email,
    role: payload.role ?? "viewer",
    status: payload.status ?? "active"
  });

  return getAdminUser(id);
}

export async function getAdminUser(id: string) {
  const db = getDb();
  const record = await db.query.adminUsers.findFirst({
    where: (fields, operators) => operators.eq(fields.id, id)
  });
  return sanitize(record);
}

export async function updateAdminUser(id: string, payload: AdminUserUpdatePayload) {
  const db = getDb();

  if (Object.keys(payload).length === 0) {
    return getAdminUser(id);
  }

  await db
    .update(adminUsers)
    .set({
      ...(payload.displayName !== undefined && { displayName: payload.displayName }),
      ...(payload.email !== undefined && { email: payload.email }),
      ...(payload.role !== undefined && { role: payload.role }),
      ...(payload.status !== undefined && { status: payload.status }),
      ...(payload.password !== undefined && { passwordHash: hashPassword(payload.password) })
    })
    .where(eq(adminUsers.id, id));

  return getAdminUser(id);
}

export async function deleteAdminUser(id: string) {
  const db = getDb();
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
}

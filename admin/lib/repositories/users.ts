import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { users } from "../schema/users";
import { getDb } from "../utils/db";
import { createId } from "../utils/id";
import type { UserCreatePayload, UserQuery, UserUpdatePayload } from "../dto/users";

function buildUserFilters(query: UserQuery): SQL | undefined {
  const filters: SQL[] = [];

  if (query.role) {
    filters.push(eq(users.role, query.role));
  }
  if (query.status) {
    filters.push(eq(users.status, query.status));
  }
  if (query.search) {
    const pattern = `%${query.search}%`;
    filters.push(or(ilike(users.fullName, pattern), ilike(users.email, pattern)));
  }

  if (!filters.length) {
    return undefined;
  }

  return filters.length === 1 ? filters[0] : and(...filters);
}

export async function listUsers(query: UserQuery = {}) {
  const db = getDb();
  const pageSize = query.pageSize ?? 20;
  const page = query.page ?? 1;
  const offset = (page - 1) * pageSize;
  const whereClause = buildUserFilters(query) ?? sql`true`;

  const [items, totalRow] = await Promise.all([
    db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause)
  ]);

  const total = Number(totalRow[0]?.count ?? 0);

  return {
    data: items,
    pagination: {
      page,
      pageSize,
      total
    }
  };
}

export async function createUser(payload: UserCreatePayload) {
  const db = getDb();
  const id = createId();
  await db.insert(users).values({
    id,
    email: payload.email,
    phone: payload.phone,
    fullName: payload.fullName,
    avatarUrl: payload.avatarUrl,
    role: payload.role ?? "patient",
    status: payload.status ?? "invited",
    metadata: payload.metadata ?? {}
  });
  return getUser(id);
}

export async function getUser(id: string) {
  const db = getDb();
  const record = await db.query.users.findFirst({
    where: (fields, operators) => operators.eq(fields.id, id)
  });
  return record ?? null;
}

export async function updateUser(id: string, payload: UserUpdatePayload) {
  const db = getDb();

  if (Object.keys(payload).length === 0) {
    return getUser(id);
  }

  await db
    .update(users)
    .set({
      ...(payload.email !== undefined && { email: payload.email }),
      ...(payload.phone !== undefined && { phone: payload.phone }),
      ...(payload.fullName !== undefined && { fullName: payload.fullName }),
      ...(payload.avatarUrl !== undefined && { avatarUrl: payload.avatarUrl }),
      ...(payload.role !== undefined && { role: payload.role }),
      ...(payload.status !== undefined && { status: payload.status }),
      ...(payload.metadata !== undefined && { metadata: payload.metadata })
    })
    .where(eq(users.id, id));

  return getUser(id);
}

export async function deleteUser(id: string) {
  const db = getDb();
  await db.delete(users).where(eq(users.id, id));
}

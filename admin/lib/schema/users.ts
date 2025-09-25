import { jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["patient", "caregiver", "family", "guest"]);
export const userStatusEnum = pgEnum("user_status", ["invited", "active", "inactive", "suspended"]);

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").default("patient").notNull(),
    status: userStatusEnum("status").default("invited").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    emailIndex: uniqueIndex("users_email_idx").on(table.email),
    phoneIndex: uniqueIndex("users_phone_idx").on(table.phone)
  })
);

export const adminRoleEnum = pgEnum("admin_role", ["superadmin", "manager", "editor", "viewer"]);
export const adminStatusEnum = pgEnum("admin_status", ["active", "inactive", "suspended"]);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    username: varchar("username", { length: 48 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    email: varchar("email", { length: 160 }),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    role: adminRoleEnum("role").default("viewer").notNull(),
    status: adminStatusEnum("status").default("active").notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    usernameIndex: uniqueIndex("admin_users_username_idx").on(table.username),
    emailIndex: uniqueIndex("admin_users_email_idx").on(table.email)
  })
);

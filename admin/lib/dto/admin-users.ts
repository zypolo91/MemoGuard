import { z } from "zod";

export const adminRoleSchema = z.enum(["superadmin", "manager", "editor", "viewer"]);
export const adminStatusSchema = z.enum(["active", "inactive", "suspended"]);

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(48)
  .regex(/^[a-zA-Z0-9_.-]+$/u, "Username may only contain letters, numbers, or ._- characters");

export const adminUserCreateSchema = z.object({
  username: usernameSchema,
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(120),
  email: z.string().email().optional(),
  role: adminRoleSchema.optional().default("viewer"),
  status: adminStatusSchema.optional().default("active")
});

export const adminUserUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  email: z.string().email().optional(),
  role: adminRoleSchema.optional(),
  status: adminStatusSchema.optional(),
  password: z.string().min(8).max(128).optional()
});

export const adminUserQuerySchema = z.object({
  role: adminRoleSchema.optional(),
  status: adminStatusSchema.optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
});

export type AdminUserCreatePayload = z.infer<typeof adminUserCreateSchema>;
export type AdminUserUpdatePayload = z.infer<typeof adminUserUpdateSchema>;
export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;

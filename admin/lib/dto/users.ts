import { z } from "zod";

export const userRoleSchema = z.enum(["patient", "caregiver", "family", "guest"]);
export const userStatusSchema = z.enum(["invited", "active", "inactive", "suspended"]);

const metadataSchema = z.record(z.unknown());
const optionalString = z.string().trim().min(1).max(120);
const phoneSchema = z
  .string()
  .trim()
  .min(4)
  .max(32)
  .regex(/^[+\d\-()\s]+$/u, "Phone number contains invalid characters");

export const userCreateSchema = z.object({
  email: z.string().email(),
  fullName: optionalString,
  phone: phoneSchema.optional(),
  avatarUrl: z.string().url().optional(),
  role: userRoleSchema.optional().default("patient"),
  status: userStatusSchema.optional().default("invited"),
  metadata: metadataSchema.optional().default({})
});

export const userUpdateSchema = userCreateSchema.partial();

export const userQuerySchema = z.object({
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
});

export type UserCreatePayload = z.infer<typeof userCreateSchema>;
export type UserUpdatePayload = z.infer<typeof userUpdateSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;

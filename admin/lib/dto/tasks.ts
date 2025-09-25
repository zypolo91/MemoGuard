import { z } from "zod";

const isoDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/u, "Timestamp must be ISO 8601");

export const taskPayloadSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  frequency: z.string().optional(),
  dueAt: isoDateTime.optional()
});

export const taskUpdateSchema = taskPayloadSchema.partial();

export const reminderPayloadSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "skipped"]),
  timestamp: isoDateTime,
  notes: z.string().optional()
});

export type TaskPayload = z.infer<typeof taskPayloadSchema>;
export type TaskUpdatePayload = z.infer<typeof taskUpdateSchema>;
export type ReminderPayload = z.infer<typeof reminderPayloadSchema>;

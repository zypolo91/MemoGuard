import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "Date must be in YYYY-MM-DD format");

const isoDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/u, "Timestamp must be ISO 8601");

export const patientProfileUpdateSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  avatarUrl: z.string().url().optional(),
  birthDate: isoDate.optional(),
  diagnosis: z.string().max(160).optional(),
  notes: z.string().optional()
});

export const patientAssessmentPayloadSchema = z.object({
  date: isoDate,
  templateId: z.string().min(1),
  label: z.string().max(120).optional(),
  metric: z.enum(["tau", "amyloid", "metabolism", "cognition", "score"]),
  value: z.number().finite(),
  unit: z.string().max(24),
  status: z.enum(["stable", "improving", "declining", "critical"]),
  notes: z.string().optional()
});

export const patientAssessmentUpdateSchema = patientAssessmentPayloadSchema.partial();

export type PatientProfileUpdate = z.infer<typeof patientProfileUpdateSchema>;
export type PatientAssessmentPayload = z.infer<typeof patientAssessmentPayloadSchema>;
export type PatientAssessmentUpdate = z.infer<typeof patientAssessmentUpdateSchema>;

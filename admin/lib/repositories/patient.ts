import { and, eq } from "drizzle-orm";
import { patientProfile, patientAssessments, assessmentTemplates } from "../schema/patient";
import { getDb } from "../utils/db";
import { createId } from "../utils/id";
import type {
  PatientAssessmentPayload,
  PatientAssessmentUpdate,
  PatientProfileUpdate
} from "../dto/patient";

export async function getPatientProfile(ownerAdminId: string) {
  const db = getDb();
  const profile = await db.query.patientProfile.findFirst({
    where: (fields, operators) => operators.eq(fields.ownerAdminId, ownerAdminId)
  });
  return profile ?? null;
}

export async function upsertDefaultPatientProfile(ownerAdminId: string) {
  const db = getDb();
  const existing = await getPatientProfile(ownerAdminId);
  if (existing) return existing;
  await db.insert(patientProfile).values({
    id: createId(),
    fullName: "Demo Patient",
    diagnosis: "",
    notes: "",
    ownerAdminId
  });
  return getPatientProfile(ownerAdminId);
}

export async function updatePatientProfile(ownerAdminId: string, updates: PatientProfileUpdate) {
  const db = getDb();
  await db
    .update(patientProfile)
    .set({
      ...(updates.fullName !== undefined && { fullName: updates.fullName }),
      ...(updates.avatarUrl !== undefined && { avatarUrl: updates.avatarUrl }),
      ...(updates.birthDate !== undefined && { birthDate: updates.birthDate }),
      ...(updates.diagnosis !== undefined && { diagnosis: updates.diagnosis }),
      ...(updates.notes !== undefined && { notes: updates.notes })
    })
    .where(eq(patientProfile.ownerAdminId, ownerAdminId));
  return getPatientProfile(ownerAdminId);
}

export async function listPatientAssessments(ownerAdminId: string) {
  const db = getDb();
  const profile = (await getPatientProfile(ownerAdminId)) ?? (await upsertDefaultPatientProfile(ownerAdminId));
  return db.query.patientAssessments.findMany({
    where: (fields, operators) => operators.eq(fields.patientId, profile!.id),
    with: {
      template: true
    },
    orderBy: (fields, { desc }) => desc(fields.recordedAt)
  });
}

export async function createPatientAssessment(ownerAdminId: string, payload: PatientAssessmentPayload) {
  const db = getDb();
  const id = createId();
  const profile = (await getPatientProfile(ownerAdminId)) ?? (await upsertDefaultPatientProfile(ownerAdminId));
  await db.insert(patientAssessments).values({
    id,
    patientId: profile!.id,
    templateId: payload.templateId,
    label: payload.label,
    metric: payload.metric,
    value: payload.value,
    unit: payload.unit,
    status: payload.status,
    notes: payload.notes,
    recordedAt: payload.date
  });
  return getPatientAssessment(ownerAdminId, id);
}

export async function getPatientAssessment(ownerAdminId: string, id: string) {
  const db = getDb();
  const profile = (await getPatientProfile(ownerAdminId)) ?? (await upsertDefaultPatientProfile(ownerAdminId));
  const record = await db.query.patientAssessments.findFirst({
    where: (fields, operators) => and(operators.eq(fields.id, id), operators.eq(fields.patientId, profile!.id)),
    with: {
      template: true
    }
  });
  return record ?? null;
}

export async function updatePatientAssessment(ownerAdminId: string, id: string, updates: PatientAssessmentUpdate) {
  const db = getDb();
  await db
    .update(patientAssessments)
    .set({
      ...(updates.templateId !== undefined && { templateId: updates.templateId }),
      ...(updates.label !== undefined && { label: updates.label }),
      ...(updates.metric !== undefined && { metric: updates.metric }),
      ...(updates.value !== undefined && { value: updates.value }),
      ...(updates.unit !== undefined && { unit: updates.unit }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      ...(updates.date !== undefined && { recordedAt: updates.date })
    })
    .where(and(eq(patientAssessments.id, id), eq(patientAssessments.patientId, (await getPatientProfile(ownerAdminId))!.id)));
  return getPatientAssessment(ownerAdminId, id);
}

export async function deletePatientAssessment(ownerAdminId: string, id: string) {
  const db = getDb();
  await db.delete(patientAssessments).where(and(eq(patientAssessments.id, id), eq(patientAssessments.patientId, (await getPatientProfile(ownerAdminId))!.id)));
}

export async function listAssessmentTemplates() {
  const db = getDb();
  return db.select().from(assessmentTemplates).orderBy(assessmentTemplates.title);
}
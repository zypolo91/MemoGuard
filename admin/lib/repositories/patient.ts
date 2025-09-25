import { and, eq } from "drizzle-orm";
import { patientProfile, patientAssessments, assessmentTemplates } from "../schema/patient";
import { getDb } from "../utils/db";
import { createId } from "../utils/id";
import type {
  PatientAssessmentPayload,
  PatientAssessmentUpdate,
  PatientProfileUpdate
} from "../dto/patient";

const DEFAULT_PATIENT_ID = "patient-001";

export async function getPatientProfile() {
  const db = getDb();
  const profile = await db.query.patientProfile.findFirst({
    where: (fields, operators) => operators.eq(fields.id, DEFAULT_PATIENT_ID)
  });
  return profile ?? null;
}

export async function upsertDefaultPatientProfile() {
  const db = getDb();
  const existing = await getPatientProfile();
  if (existing) return existing;
  await db.insert(patientProfile).values({
    id: DEFAULT_PATIENT_ID,
    fullName: "Demo Patient",
    diagnosis: "",
    notes: ""
  });
  return getPatientProfile();
}

export async function updatePatientProfile(updates: PatientProfileUpdate) {
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
    .where(eq(patientProfile.id, DEFAULT_PATIENT_ID));
  return getPatientProfile();
}

export async function listPatientAssessments() {
  const db = getDb();
  await upsertDefaultPatientProfile();
  return db.query.patientAssessments.findMany({
    where: (fields, operators) => operators.eq(fields.patientId, DEFAULT_PATIENT_ID),
    with: {
      template: true
    },
    orderBy: (fields, { desc }) => desc(fields.recordedAt)
  });
}

export async function createPatientAssessment(payload: PatientAssessmentPayload) {
  const db = getDb();
  const id = createId();
  await db.insert(patientAssessments).values({
    id,
    patientId: DEFAULT_PATIENT_ID,
    templateId: payload.templateId,
    label: payload.label,
    metric: payload.metric,
    value: payload.value,
    unit: payload.unit,
    status: payload.status,
    notes: payload.notes,
    recordedAt: payload.date
  });
  return getPatientAssessment(id);
}

export async function getPatientAssessment(id: string) {
  const db = getDb();
  const record = await db.query.patientAssessments.findFirst({
    where: (fields, operators) => operators.eq(fields.id, id),
    with: {
      template: true
    }
  });
  return record ?? null;
}

export async function updatePatientAssessment(id: string, updates: PatientAssessmentUpdate) {
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
    .where(eq(patientAssessments.id, id));
  return getPatientAssessment(id);
}

export async function deletePatientAssessment(id: string) {
  const db = getDb();
  await db.delete(patientAssessments).where(eq(patientAssessments.id, id));
}

export async function listAssessmentTemplates() {
  const db = getDb();
  return db.select().from(assessmentTemplates).orderBy(assessmentTemplates.title);
}

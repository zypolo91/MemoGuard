import type { AssessmentMetric, PatientProfile } from "@/stores/patient";

import { seedPatientAssessments, seedPatientProfile } from "./seed";
import { clone, delay } from "./utils";

export type PatientAssessmentPayload = {
  date: string;
  templateId: string;
  label: string;
  metric: AssessmentMetric;
  value: number | null;
  unit: string;
  status: string;
  notes?: string;
};

type PatientAssessmentRecord = PatientAssessmentPayload & { id: string };

let currentProfile: PatientProfile = clone(seedPatientProfile);
let currentAssessments: PatientAssessmentRecord[] = seedPatientAssessments.map((item) => ({
  ...item
}));

function createAssessmentId() {
  return `assess-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeAssessmentRecord(
  record: PatientAssessmentRecord | (PatientAssessmentPayload & { id?: string })
): PatientAssessmentRecord {
  const value =
    record.value === null || record.value === undefined || Number.isNaN(Number(record.value))
      ? null
      : Number(record.value);

  return {
    id: record.id ?? createAssessmentId(),
    date: record.date,
    templateId: record.templateId,
    label: record.label,
    metric: record.metric,
    value,
    unit: record.unit,
    status: record.status,
    notes: record.notes?.trim() ? record.notes.trim() : undefined
  };
}

function sortAssessments() {
  currentAssessments.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

sortAssessments();

export async function getPatientProfile() {
  await delay();
  return clone(currentProfile);
}

export async function updatePatientProfile(updates: Partial<PatientProfile>) {
  await delay();
  currentProfile = { ...currentProfile, ...updates };
  return clone(currentProfile);
}

export async function listPatientAssessments() {
  await delay();
  return clone(currentAssessments);
}

export async function createPatientAssessment(payload: PatientAssessmentPayload) {
  await delay();
  const record = normalizeAssessmentRecord(payload);
  currentAssessments = [...currentAssessments, record];
  sortAssessments();
  return clone(record);
}

export async function updatePatientAssessment(
  id: string,
  updates: Partial<PatientAssessmentPayload>
) {
  await delay();
  let updated: PatientAssessmentRecord | null = null;
  currentAssessments = currentAssessments.map((item) => {
    if (item.id !== id) return item;
    updated = normalizeAssessmentRecord({ ...item, ...updates, id });
    return updated;
  });
  if (!updated) {
    throw new Error("Assessment not found");
  }
  sortAssessments();
  return clone(updated);
}

export async function deletePatientAssessment(id: string) {
  await delay();
  const sizeBefore = currentAssessments.length;
  currentAssessments = currentAssessments.filter((item) => item.id !== id);
  return sizeBefore !== currentAssessments.length;
}

export function hydratePatientFromSnapshot(snapshot: {
  profile?: PatientProfile;
  assessments?: PatientAssessmentRecord[];
}) {
  if (snapshot.profile) {
    currentProfile = clone(snapshot.profile);
  }
  if (snapshot.assessments) {
    currentAssessments = snapshot.assessments.map((item) => normalizeAssessmentRecord(item));
    sortAssessments();
  }
}



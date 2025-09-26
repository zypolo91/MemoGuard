import { apiFetch } from "./client";
import type {
  PatientAssessmentPayload,
  PatientAssessmentUpdate,
  PatientProfileUpdate
} from "@/lib/dto/patient";

type AssessmentStatus = "stable" | "improving" | "declining" | "critical";
type AssessmentMetric = "tau" | "amyloid" | "metabolism" | "cognition" | "score";

export interface PatientProfileRecord {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  birthDate?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentTemplateRecord {
  id: string;
  title: string;
  description?: string | null;
  metric: AssessmentMetric;
  defaultUnit?: string | null;
  lowerBound?: string | null;
  upperBound?: string | null;
  createdAt: string;
}

export interface PatientAssessmentRecord {
  id: string;
  patientId: string;
  templateId: string;
  label?: string | null;
  metric: AssessmentMetric;
  value: string;
  unit?: string | null;
  status: AssessmentStatus;
  notes?: string | null;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
  template?: AssessmentTemplateRecord | null;
}

export interface AssessmentListResponse {
  assessments: PatientAssessmentRecord[];
  templates: AssessmentTemplateRecord[];
}

export async function getPatientProfile() {
  return apiFetch<PatientProfileRecord | null>("/api/patient/profile");
}

export async function updatePatientProfile(payload: PatientProfileUpdate) {
  return apiFetch<PatientProfileRecord>("/api/patient/profile", {
    method: "PATCH",
    json: payload
  });
}

export async function listAssessments() {
  return apiFetch<AssessmentListResponse>("/api/patient/assessments");
}

export async function createAssessment(payload: PatientAssessmentPayload) {
  return apiFetch<PatientAssessmentRecord>("/api/patient/assessments", {
    method: "POST",
    json: payload
  });
}

export async function updateAssessment(id: string, payload: PatientAssessmentUpdate) {
  return apiFetch<PatientAssessmentRecord>(`/api/patient/assessments/${id}`, {
    method: "PATCH",
    json: payload
  });
}

export async function deleteAssessment(id: string) {
  await apiFetch<void>(`/api/patient/assessments/${id}`, {
    method: "DELETE"
  });
}

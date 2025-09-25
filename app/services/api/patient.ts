import { apiFetch } from "./client";

export interface RemotePatientProfile {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  birthDate?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RemotePatientAssessment {
  id: string;
  patientId: string;
  templateId: string;
  label?: string | null;
  metric: string;
  value: number;
  unit?: string | null;
  status: string;
  notes?: string | null;
  recordedAt: string;
  template?: {
    id: string;
    title: string;
    metric: string;
    defaultUnit?: string | null;
  } | null;
}

export interface RemoteAssessmentTemplate {
  id: string;
  title: string;
  description?: string | null;
  metric: string;
  defaultUnit?: string | null;
  lowerBound?: string | null;
  upperBound?: string | null;
}

export async function fetchPatientProfile() {
  return apiFetch<RemotePatientProfile>("/patient/profile", {
    method: "GET"
  });
}

export async function patchPatientProfile(payload: Partial<RemotePatientProfile>) {
  return apiFetch<RemotePatientProfile>("/patient/profile", {
    method: "PATCH",
    json: payload
  });
}

export interface PatientAssessmentsResponse {
  assessments: RemotePatientAssessment[];
  templates: RemoteAssessmentTemplate[];
}

export async function fetchPatientAssessments() {
  return apiFetch<PatientAssessmentsResponse>("/patient/assessments", {
    method: "GET"
  });
}

export interface AssessmentPayload {
  date: string;
  templateId: string;
  label?: string;
  metric: string;
  value: number;
  unit: string;
  status: string;
  notes?: string;
}

export async function createAssessment(payload: AssessmentPayload) {
  return apiFetch<RemotePatientAssessment>("/patient/assessments", {
    method: "POST",
    json: payload
  });
}

export async function updateAssessment(id: string, payload: Partial<AssessmentPayload>) {
  return apiFetch<RemotePatientAssessment>(`/patient/assessments/${id}`, {
    method: "PATCH",
    json: payload
  });
}

export async function deleteAssessment(id: string) {
  await apiFetch<void>(`/patient/assessments/${id}`, {
    method: "DELETE"
  });
}

import { computed, ref } from "vue";
import { defineStore } from "pinia";

import {
  createAssessment,
  deleteAssessment,
  fetchPatientAssessments,
  fetchPatientProfile,
  patchPatientProfile,
  updateAssessment,
  type AssessmentPayload,
  type PatientAssessmentsResponse,
  type RemoteAssessmentTemplate,
  type RemotePatientAssessment,
  type RemotePatientProfile
} from "@/services/api/patient";

export interface PatientProfile {
  id: string;
  name: string;
  fullName?: string;
  avatar?: string | null;
  birthDate?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  caregiver?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  medications?: string[];
}

export type AssessmentMetric = "score" | "tau" | "amyloid" | "metabolism" | "cognition";

export interface AssessmentTemplate {
  id: string;
  label: string;
  metric: AssessmentMetric;
  defaultUnit: string;
  unitOptions: string[];
  description?: string;
}

export interface PatientAssessment {
  id: string;
  date: string;
  templateId: string;
  label: string;
  metric: AssessmentMetric;
  value: number | null;
  unit: string;
  status: string;
  notes?: string;
}

const FALLBACK_TEMPLATES: AssessmentTemplate[] = [
  {
    id: "cognitive-moca",
    label: "MoCA",
    metric: "score",
    defaultUnit: "分",
    unitOptions: ["分"],
    description: "蒙特利尔认知评估"
  },
  {
    id: "cognitive-mmse",
    label: "MMSE",
    metric: "score",
    defaultUnit: "分",
    unitOptions: ["分"],
    description: "简易精神状态检查"
  },
  {
    id: "pet-tau",
    label: "PET Tau",
    metric: "tau",
    defaultUnit: "SUVR",
    unitOptions: ["SUVR"],
    description: "Tau PET 影像"
  },
  {
    id: "pet-amyloid",
    label: "Amyloid PET",
    metric: "amyloid",
    defaultUnit: "SUVR",
    unitOptions: ["SUVR"],
    description: "淀粉样蛋白 PET 影像"
  }
];

export const assessmentTemplates: AssessmentTemplate[] = [...FALLBACK_TEMPLATES];

let templateMap = new Map<string, AssessmentTemplate>(assessmentTemplates.map((template) => [template.id, template]));
let templateLabelMap = new Map<string, AssessmentTemplate>(
  assessmentTemplates.map((template) => [template.label.toLowerCase(), template])
);

const metricUnitFallback: Record<AssessmentMetric, string> = {
  score: "分",
  tau: "pg/mL",
  amyloid: "pg/mL",
  metabolism: "SUVR",
  cognition: "分"
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function updateTemplates(remote?: RemoteAssessmentTemplate[] | null) {
  if (!remote?.length) return;
  const normalized: AssessmentTemplate[] = remote.map((item) => {
    const metric = (item.metric as AssessmentMetric) ?? "score";
    const unit = item.defaultUnit ?? metricUnitFallback[metric] ?? "";
    return {
      id: item.id,
      label: item.title ?? item.id,
      metric,
      defaultUnit: unit,
      unitOptions: unit ? [unit] : [],
      description: item.description ?? undefined
    };
  });

  assessmentTemplates.splice(0, assessmentTemplates.length, ...normalized);
  templateMap = new Map(normalized.map((template) => [template.id, template]));
  templateLabelMap = new Map(normalized.map((template) => [template.label.toLowerCase(), template]));
}

function adaptProfile(remote: RemotePatientProfile): PatientProfile {
  return {
    id: remote.id,
    name: remote.fullName ?? "未命名患者",
    fullName: remote.fullName,
    avatar: remote.avatarUrl ?? null,
    birthDate: remote.birthDate ?? null,
    diagnosis: remote.diagnosis ?? undefined,
    notes: remote.notes ?? undefined
  };
}

function toNumeric(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveTemplate(input: { templateId?: string; template?: string; label?: string }) {
  if (input.templateId && templateMap.has(input.templateId)) return templateMap.get(input.templateId);
  if (input.template && templateMap.has(input.template)) return templateMap.get(input.template);
  if (input.label) {
    const key = input.label.trim().toLowerCase();
    if (templateLabelMap.has(key)) return templateLabelMap.get(key);
  }
  return undefined;
}

function normalizeAssessment(raw: RemotePatientAssessment | (PatientAssessment & { metric?: string })) {
  const template = resolveTemplate({
    templateId: raw.templateId,
    template: raw.template?.id,
    label: raw.label ?? raw.template?.title
  });

  const metric = (raw.metric as AssessmentMetric) || template?.metric || "score";
  const date = raw.recordedAt ?? (raw as any).date ?? new Date().toISOString().slice(0, 10);
  const value = toNumeric(raw.value ?? (raw as any).value);
  const unit =
    (typeof raw.unit === "string" && raw.unit.trim()) ||
    template?.defaultUnit ||
    metricUnitFallback[metric] ||
    "";

  return {
    id: raw.id ?? createId("assess"),
    date,
    templateId: raw.templateId ?? template?.id ?? "",
    label: raw.label ?? template?.label ?? "",
    metric,
    value,
    unit,
    status: typeof raw.status === "string" && raw.status.trim().length ? raw.status : "未填写",
    notes: typeof raw.notes === "string" && raw.notes.trim().length ? raw.notes.trim() : undefined
  } satisfies PatientAssessment;
}

type AssessmentCreateInput = {
  date: string;
  templateId: string;
  value: number | null;
  unit?: string;
  status: string;
  notes?: string;
  label?: string;
  metric?: AssessmentMetric;
};

type AssessmentUpdateInput = Partial<AssessmentCreateInput>;

function toApiPayload(input: AssessmentCreateInput & { id?: string }): AssessmentPayload {
  const template = resolveTemplate({ templateId: input.templateId });
  const metric = input.metric ?? template?.metric ?? "score";
  const unit = input.unit ?? template?.defaultUnit ?? metricUnitFallback[metric] ?? "";

  return {
    date: input.date,
    templateId: input.templateId,
    label: input.label ?? template?.label ?? "",
    metric,
    value: Number.isFinite(input.value ?? NaN) ? Number(input.value) : 0,
    unit,
    status: input.status,
    notes: input.notes
  } satisfies AssessmentPayload;
}

export const usePatientStore = defineStore("patient", () => {
  const profile = ref<PatientProfile | null>(null);
  const profileState = ref<"idle" | "loading" | "success" | "error">("idle");
  const profileError = ref<string | null>(null);

  const assessmentsRaw = ref<PatientAssessment[]>([]);
  const assessmentsState = ref<"idle" | "loading" | "success" | "error">("idle");
  const assessmentsError = ref<string | null>(null);

  const orderedAssessments = computed(() =>
    [...assessmentsRaw.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );

  async function fetchProfile() {
    profileState.value = "loading";
    profileError.value = null;
    try {
      const remote = await fetchPatientProfile();
      profile.value = adaptProfile(remote);
      profileState.value = "success";
    } catch (error) {
      profileError.value = error instanceof Error ? error.message : String(error);
      profileState.value = profile.value ? "success" : "error";
    }
  }

  async function updateProfile(updates: Partial<PatientProfile>) {
    const payload: Partial<RemotePatientProfile> = {
      fullName: updates.fullName ?? updates.name,
      avatarUrl: updates.avatar,
      birthDate: updates.birthDate,
      diagnosis: updates.diagnosis,
      notes: updates.notes
    };
    const remote = await patchPatientProfile(payload);
    profile.value = adaptProfile(remote);
    return profile.value;
  }

  async function fetchAssessments() {
    assessmentsState.value = "loading";
    assessmentsError.value = null;
    try {
      const response: PatientAssessmentsResponse = await fetchPatientAssessments();
      updateTemplates(response.templates);
      assessmentsRaw.value = response.assessments.map((item) => normalizeAssessment(item));
      assessmentsState.value = "success";
    } catch (error) {
      assessmentsError.value = error instanceof Error ? error.message : String(error);
      assessmentsState.value = assessmentsRaw.value.length ? "success" : "error";
    }
  }

  async function addAssessment(entry: AssessmentCreateInput): Promise<string> {
    const payload = toApiPayload(entry);
    const created = await createAssessment(payload);
    const normalized = normalizeAssessment(created);
    assessmentsRaw.value = [...assessmentsRaw.value, normalized];
    return normalized.id;
  }

  async function updateAssessmentEntry(id: string, updates: AssessmentUpdateInput) {
    const existing = assessmentsRaw.value.find((item) => item.id === id);
    if (!existing) return;
    const payload = toApiPayload({ ...existing, ...updates });
    const updated = await updateAssessment(id, payload);
    const normalized = normalizeAssessment(updated);
    assessmentsRaw.value = assessmentsRaw.value.map((item) => (item.id === id ? normalized : item));
  }

  async function removeAssessment(id: string) {
    await deleteAssessment(id);
    assessmentsRaw.value = assessmentsRaw.value.filter((item) => item.id !== id);
  }

  return {
    profile,
    profileState,
    profileError,
    assessments: orderedAssessments,
    assessmentsState,
    assessmentsError,
    fetchProfile,
    updateProfile,
    fetchAssessments,
    addAssessment,
    updateAssessment: updateAssessmentEntry,
    removeAssessment
  };
});

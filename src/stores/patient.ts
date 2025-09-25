import { computed, ref } from "vue";
import { defineStore } from "pinia";

import {
  createPatientAssessment,
  deletePatientAssessment,
  getPatientProfile,
  listPatientAssessments,
  updatePatientAssessment,
  updatePatientProfile,
  type PatientAssessmentPayload
} from "@/services/mockApi/patient";

export interface PatientProfile {
  id: string;
  name: string;
  gender: "男" | "女" | "其他" | string;
  age: number;
  birthDate: string;
  diagnosisDate: string;
  caregiver: string;
  contactPhone: string;
  address: string;
  medications: string[];
  notes?: string;
}

export type AssessmentMetric = "score" | "tau" | "amyloid";

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

export const assessmentTemplates: AssessmentTemplate[] = [
  {
    id: "cognitive-moca",
    label: "MoCA",
    metric: "score",
    defaultUnit: "分",
    unitOptions: ["分"],
    description: "蒙特利尔认知评估",
  },
  {
    id: "cognitive-mmse",
    label: "MMSE",
    metric: "score",
    defaultUnit: "分",
    unitOptions: ["分"],
    description: "简易精神状态检查",
  },

  {
    id: "pet-tau",
    label: "PET Tau",
    metric: "tau",
    defaultUnit: "SUVR",
    unitOptions: ["SUVR"],
    description: "Tau PET 影像",
  },

  {
    id: "pet-amyloid",
    label: "Amyloid PET",
    metric: "amyloid",
    defaultUnit: "SUVR",
    unitOptions: ["SUVR"],
    description: "淀粉样蛋白 PET 影像",
  },
];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const templateMap = new Map(
  assessmentTemplates.map((template) => [template.id, template] as const),
);
const templateLabelMap = new Map(
  assessmentTemplates.map((template) => [template.label.toLowerCase(), template] as const),
);

const metricUnitFallback: Record<AssessmentMetric, string> = {
  score: "分",
  tau: "pg/mL",
  amyloid: "pg/mL",
};

function resolveTemplate(input: any): AssessmentTemplate | undefined {
  if (typeof input?.templateId === "string" && templateMap.has(input.templateId)) {
    return templateMap.get(input.templateId);
  }
  if (typeof input?.template === "string" && templateMap.has(input.template)) {
    return templateMap.get(input.template);
  }
  if (typeof input?.assessment === "string") {
    const key = input.assessment.trim().toLowerCase();
    if (templateLabelMap.has(key)) return templateLabelMap.get(key);
  }
  if (typeof input?.label === "string") {
    const key = input.label.trim().toLowerCase();
    if (templateLabelMap.has(key)) return templateLabelMap.get(key);
  }
  return undefined;
}

function toNumeric(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferMetric(raw: any, template?: AssessmentTemplate): AssessmentMetric {
  if (template) return template.metric;
  if (raw?.metric === "tau" || raw?.metric === "amyloid" || raw?.metric === "score") {
    return raw.metric;
  }
  if (raw?.tauLevel !== undefined || raw?.tau !== undefined) return "tau";
  if (
    raw?.amyloidBetaLevel !== undefined ||
    raw?.amyloidBeta !== undefined ||
    raw?.abLevel !== undefined
  ) {
    return "amyloid";
  }
  return "score";
}

function deriveValue(raw: any, metric: AssessmentMetric): number | null {
  if (raw?.value !== undefined) {
    const numeric = toNumeric(raw.value);
    if (numeric !== null) return numeric;
  }
  if (metric === "score") return toNumeric(raw?.score);
  if (metric === "tau") return toNumeric(raw?.tauLevel ?? raw?.tau ?? raw?.tauValue);
  return toNumeric(raw?.amyloidBetaLevel ?? raw?.amyloidBeta ?? raw?.abLevel);
}

function normalizeAssessment(raw: any): PatientAssessment {
  const date =
    typeof raw?.date === "string" && raw.date.length
      ? raw.date
      : new Date().toISOString().slice(0, 10);

  const template = resolveTemplate(raw);
  const metric = inferMetric(raw, template);

  const templateId =
    (typeof raw?.templateId === "string" && raw.templateId.length
      ? raw.templateId
      : template?.id) ?? `custom-${metric}`;

  const labelSource =
    (typeof raw?.label === "string" && raw.label.trim().length
      ? raw.label.trim()
      : typeof raw?.assessment === "string" && raw.assessment.trim().length
        ? raw.assessment.trim()
        : template?.label) ?? "自定义评估";

  const value = deriveValue(raw, metric);
  const unitRaw =
    typeof raw?.unit === "string" && raw.unit.trim().length ? raw.unit.trim() : undefined;
  const unit = unitRaw ?? template?.defaultUnit ?? metricUnitFallback[metric];

  const statusRaw = typeof raw?.status === "string" ? raw.status.trim() : "";
  const notesRaw = typeof raw?.notes === "string" ? raw.notes.trim() : "";

  return {
    id: typeof raw?.id === "string" && raw.id.length ? raw.id : uid("assess"),
    date,
    templateId,
    label: template?.label ?? labelSource,
    metric,
    value,
    unit,
    status: statusRaw || "未填写",
    notes: notesRaw || undefined,
  };
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

function toApiPayload(source: AssessmentCreateInput & { id?: string }): PatientAssessmentPayload {
  const normalized = normalizeAssessment(source);
  return {
    date: normalized.date,
    templateId: normalized.templateId,
    label: normalized.label,
    metric: normalized.metric,
    value: normalized.value,
    unit: normalized.unit,
    status: normalized.status,
    notes: normalized.notes,
  };
}

export const usePatientStore = defineStore("patient", () => {
  const profile = ref<PatientProfile | null>(null);
  const profileState = ref<"idle" | "loading" | "success" | "error">("idle");
  const profileError = ref<string | null>(null);

  const assessments = ref<PatientAssessment[]>([]);
  const assessmentsState = ref<"idle" | "loading" | "success" | "error">("idle");
  const assessmentsError = ref<string | null>(null);

  const orderedAssessments = computed(() =>
    [...assessments.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );

  async function fetchProfile() {
    profileState.value = "loading";
    profileError.value = null;
    try {
      profile.value = await getPatientProfile();
      profileState.value = "success";
    } catch (error) {
      profileError.value = error instanceof Error ? error.message : String(error);
      profileState.value = profile.value ? "success" : "error";
    }
  }

  async function updateProfile(updates: Partial<PatientProfile>) {
    const updated = await updatePatientProfile(updates);
    profile.value = updated;
    return updated;
  }

  async function fetchAssessments() {
    assessmentsState.value = "loading";
    assessmentsError.value = null;
    try {
      const remote = await listPatientAssessments();
      assessments.value = remote.map((item) => normalizeAssessment(item));
      assessmentsState.value = "success";
    } catch (error) {
      assessmentsError.value = error instanceof Error ? error.message : String(error);
      assessmentsState.value = assessments.value.length ? "success" : "error";
    }
  }

  async function addAssessment(entry: AssessmentCreateInput): Promise<string> {
    const payload = toApiPayload(entry);
    const created = await createPatientAssessment(payload);
    const normalized = normalizeAssessment(created);
    assessments.value = [...assessments.value, normalized];
    return normalized.id;
  }

  async function updateAssessment(id: string, updates: AssessmentUpdateInput) {
    const existing = assessments.value.find((item) => item.id === id);
    if (!existing) return;
    const payload = toApiPayload({ ...existing, ...updates });
    const updated = await updatePatientAssessment(id, payload);
    const normalized = normalizeAssessment(updated);
    assessments.value = assessments.value.map((item) => (item.id === id ? normalized : item));
  }

  async function removeAssessment(id: string) {
    const removed = await deletePatientAssessment(id);
    if (!removed) return;
    assessments.value = assessments.value.filter((item) => item.id !== id);
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
    updateAssessment,
    removeAssessment,
  };
});

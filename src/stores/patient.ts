import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";

import { loadState, saveState } from "@/utils/storage";

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

const PROFILE_STORAGE_KEY = "patient:profile";
const ASSESSMENTS_STORAGE_KEY = "patient:assessments";

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

const defaultProfile: PatientProfile = {
  id: "patient-001",
  name: "李慧敏",
  gender: "女",
  age: 72,
  birthDate: "1953-04-18",
  diagnosisDate: "2023-06-12",
  caregiver: "张伟（家属）",
  contactPhone: "138-0000-1234",
  address: "上海市浦东新区",
  medications: ["多奈哌齐 5mg 每日一次", "褪黑素 2mg 睡前服用"],
  notes: "夜间偶有迷路，与家属共同进行记忆训练。",
};

const defaultAssessmentSeed = [
  {
    date: "2023-03-18",
    templateId: "cognitive-moca",
    value: 20,
    status: "轻度认知下降",
    notes: "执行功能稍弱，建议继续训练。",
  },
  {
    date: "2023-09-22",
    templateId: "pet-amyloid",
    value: 1.42,
    unit: "SUVR",
    status: "淀粉样蛋白明显沉积",
    notes: "顶叶与颞叶摄取增高。",
  },
  {
    date: "2024-03-05",
    templateId: "cognitive-moca",
    value: 18.5,
    status: "持续下降需干预",
    notes: "注意力波动，建议增加日间活动。",
  },
  {
    date: "2024-08-30",
    templateId: "pet-tau",
    value: 1.28,
    unit: "SUVR",
    status: "海马区 tau 聚集增加",
    notes: "左侧海马强化明显。",
  },
];

const defaultAssessments: PatientAssessment[] = defaultAssessmentSeed
  .map((item) => normalizeAssessment(item))
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export const usePatientStore = defineStore("patient", () => {
  const storedProfile = loadState<PatientProfile>(PROFILE_STORAGE_KEY, defaultProfile);
  const profile = ref<PatientProfile>(storedProfile);

  const storedAssessments = loadState<PatientAssessment[]>(
    ASSESSMENTS_STORAGE_KEY,
    defaultAssessments,
  );
  const assessments = ref<PatientAssessment[]>(
    Array.isArray(storedAssessments)
      ? storedAssessments.map((item) => normalizeAssessment(item))
      : [],
  );

  const orderedAssessments = computed(() =>
    [...assessments.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  );

  function updateProfile(updates: Partial<PatientProfile>) {
    profile.value = { ...profile.value, ...updates };
  }

  function addAssessment(
    entry: Omit<PatientAssessment, "id" | "label" | "metric"> & {
      templateId: string;
      label?: string;
      metric?: AssessmentMetric;
    },
  ): string {
    const normalized = normalizeAssessment(entry);
    assessments.value = [...assessments.value, normalized];
    return normalized.id;
  }

  function updateAssessment(id: string, updates: Partial<PatientAssessment>) {
    assessments.value = assessments.value.map((assessment) => {
      if (assessment.id !== id) return assessment;
      return normalizeAssessment({ ...assessment, ...updates, id });
    });
  }

  function removeAssessment(id: string) {
    assessments.value = assessments.value.filter((assessment) => assessment.id !== id);
  }

  watch(profile, (value) => saveState(PROFILE_STORAGE_KEY, value), { deep: true });

  watch(
    assessments,
    (value) =>
      saveState(
        ASSESSMENTS_STORAGE_KEY,
        [...value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      ),
    { deep: true },
  );

  return {
    profile,
    assessments: orderedAssessments,
    updateProfile,
    addAssessment,
    updateAssessment,
    removeAssessment,
  };
});

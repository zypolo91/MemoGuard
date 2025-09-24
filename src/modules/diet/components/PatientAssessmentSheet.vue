<template>
  <Transition name="sheet">
    <div
      v-if="open"
      class="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-8 sm:px-8"
      @keydown.esc.prevent.stop="emitClose"
    >
      <div class="relative flex max-h-[80vh] w-full max-w-[680px] flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl">
        <header class="flex items-center justify-between border-b border-outline border-opacity-30 bg-surface px-6 py-5">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-content">{{ headerTitle }}</h2>
            <p class="text-xs text-content/60">
              {{
                isEditing
                  ? "更新评估记录与对应指标，持续掌握病程变化"
                  : "选择测评类型并补充量化指标，构建病程轨迹"
              }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <UiIconButton
              v-if="isEditing"
              aria-label="删除评估"
              class="text-danger"
              @click="confirmDelete"
            >
              <TrashIcon class="h-5 w-5" />
            </UiIconButton>
            <UiIconButton aria-label="关闭" @click="emitClose">
              <XMarkIcon class="h-5 w-5" />
            </UiIconButton>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto px-6 py-5">
          <div
            v-if="errorMessage"
            class="mb-4 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger"
          >
            {{ errorMessage }}
          </div>

          <form class="space-y-7" @submit.prevent="handleSubmit">
            <section class="grid gap-4 sm:grid-cols-2">
              <label class="space-y-2 text-sm text-content">
                <span>评估日期 *</span>
                <input
                  v-model="form.date"
                  type="date"
                  required
                  class="input"
                />
              </label>
              <label class="space-y-2 text-sm text-content">
                <span>评估类型 *</span>
                <select v-model="form.templateId" required class="input">
                  <option value="" disabled>请选择评估类型</option>
                  <option
                    v-for="template in templateOptions"
                    :key="template.id"
                    :value="template.id"
                  >
                    {{ template.label }} · {{ metricLabel(template.metric) }}
                  </option>
                </select>
                <p v-if="selectedTemplate?.description" class="text-xs text-content/50">
                  {{ selectedTemplate.description }}
                </p>
              </label>
            </section>

            <section class="grid gap-4 sm:grid-cols-2">
              <label class="space-y-2 text-sm text-content sm:col-span-2">
                <span>{{ metricValueLabel }} *</span>
                <div class="flex items-center gap-2">
                  <input
                    v-model="form.value"
                    :type="inputType"
                    :inputmode="inputMode"
                    :min="metric.value === 'score' ? 0 : null"
                    :step="metric.value === 'score' ? valueStep : null"
                    :placeholder="valuePlaceholder"
                    :disabled="!selectedTemplate"
                    class="input min-w-[160px] grow"
                    required
                  />
                  <select
                    v-if="unitOptions.length > 1"
                    v-model="form.unit"
                    class="input w-28"
                    :disabled="!selectedTemplate"
                  >
                    <option v-for="unit in unitOptions" :key="unit" :value="unit">
                      {{ unit }}
                    </option>
                  </select>
                  <span v-else class="rounded-full bg-surface-muted px-3 py-2 text-xs text-content/60">
                    {{ unitOptions[0] ?? "" }}
                  </span>
                </div>
                <p class="text-xs text-content/40">{{ valueHint }}</p>
              </label>

              <label class="space-y-2 text-sm text-content sm:col-span-2">
                <span>当前状态 *</span>
                <input
                  v-model.trim="form.status"
                  type="text"
                  required
                  placeholder="例如：轻度认知下降、需关注、持续稳定"
                  class="input"
                />
              </label>
            </section>

            <label class="space-y-2 text-sm text-content">
              <span>备注</span>
              <textarea
                v-model.trim="form.notes"
                rows="4"
                placeholder="补充检测方法、影像观察或下一步计划"
                class="input"
              ></textarea>
            </label>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                class="rounded-full border border-outline border-opacity-40 px-4 py-2 text-xs text-content/60"
                @click="emitClose"
              >
                取消
              </button>
              <button type="submit" class="primary-button px-6 py-2 text-sm font-medium">
                {{ submitLabel }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { TrashIcon, XMarkIcon } from "@heroicons/vue/24/outline";

import UiIconButton from "@/components/atoms/UiIconButton.vue";
import {
  assessmentTemplates,
  type AssessmentMetric,
  type AssessmentTemplate,
  type PatientAssessment
} from "@/stores/patient";

const metricLabels: Record<AssessmentMetric, string> = {
  score: "认知得分",
  tau: "Tau 蛋白",
  amyloid: "Aβ 蛋白"
};

const metricPlaceholders: Record<AssessmentMetric, string> = {
  score: "例如：18.5",
  tau: "例如：1.28",
  amyloid: "例如：0.95"
};

const metricSteps: Record<AssessmentMetric, number> = {
  score: 0.5,
  tau: 0.01,
  amyloid: 0.01
};

const unitFallback: Record<AssessmentMetric, string> = {
  score: "分",
  tau: "pg/mL",
  amyloid: "pg/mL"
};

const props = defineProps<{
  open: boolean;
  mode: "create" | "edit";
  assessment?: PatientAssessment | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", payload: { id?: string; data: AssessmentPayload }): void;
  (e: "delete", id: string): void;
}>();

type AssessmentPayload = {
  date: string;
  templateId: string;
  label?: string;
  metric?: AssessmentMetric;
  value: number;
  unit: string;
  status: string;
  notes?: string;
};

const templateOptions = ref<AssessmentTemplate[]>([...assessmentTemplates]);

const form = reactive({
  date: "",
  templateId: templateOptions.value[0]?.id ?? "",
  value: "",
  unit: templateOptions.value[0]?.defaultUnit ?? unitFallback.score,
  status: "",
  notes: ""
});

const errorMessage = ref("");
const hydrating = ref(false);

const selectedTemplate = computed<AssessmentTemplate | undefined>(() =>
  templateOptions.value.find((item) => item.id === form.templateId)
);

const metric = computed<AssessmentMetric>(() => selectedTemplate.value?.metric ?? "score");

const unitOptions = computed(() => {
  const template = selectedTemplate.value;
  if (!template) return [] as string[];
  const options = template.unitOptions.length ? template.unitOptions : [template.defaultUnit];
  const fallback = unitFallback[template.metric];
  return options.length ? options : [fallback];
});

const metricValueLabel = computed(() => metricLabels[metric.value]);
const valueStep = computed(() => metricSteps[metric.value]);
const valuePlaceholder = computed(() => metricPlaceholders[metric.value]);
const inputType = computed(() => (metric.value === "score" ? "number" : "text"));
const inputMode = computed(() => (metric.value === "score" ? "decimal" : "text"));

const valueHint = computed(() =>
  metric.value === "score"
    ? "建议记录 0-30 的得分，若未进行可改选其他测评。"
    : `请输入 ${metricLabels[metric.value]} 的量化读数，可根据检测方式调整单位。`
);

const isEditing = computed(() => props.mode === "edit" && !!props.assessment);
const headerTitle = computed(() => (isEditing.value ? "编辑评估" : "新增评估"));
const submitLabel = computed(() => (isEditing.value ? "保存更新" : "创建记录"));

watch(
  () => props.open,
  (open) => {
    if (open) {
      hydrateForm(props.assessment ?? null);
    } else {
      resetForm();
    }
  }
);

watch(
  () => props.assessment,
  (next) => {
    if (props.open && next) {
      hydrateForm(next);
    }
  }
);

watch(
  () => form.templateId,
  () => {
    if (hydrating.value) return;
    const template = selectedTemplate.value;
    if (!template) return;
    form.unit = template.defaultUnit || unitFallback[template.metric];
    form.value = "";
    errorMessage.value = "";
  }
);

function metricLabel(value: AssessmentMetric) {
  return metricLabels[value];
}

function ensureTemplateExists(entry: PatientAssessment) {
  if (!entry.templateId) return;
  if (templateOptions.value.some((template) => template.id === entry.templateId)) return;
  const fallbackUnit = entry.unit || unitFallback[entry.metric];
  templateOptions.value = [
    ...templateOptions.value,
    {
      id: entry.templateId,
      label: entry.label,
      metric: entry.metric,
      defaultUnit: fallbackUnit,
      unitOptions: [fallbackUnit]
    }
  ];
}

function hydrateForm(source: PatientAssessment | null) {
  hydrating.value = true;
  if (!source) {
    resetForm();
    hydrating.value = false;
    return;
  }

  ensureTemplateExists(source);

  form.date = source.date ?? "";
  form.templateId = source.templateId ?? templateOptions.value[0]?.id ?? "";
  form.value = source.value !== null && source.value !== undefined ? String(source.value) : "";
  form.unit = source.unit ?? selectedTemplate.value?.defaultUnit ?? unitFallback[source.metric];
  form.status = source.status ?? "";
  form.notes = source.notes ?? "";
  errorMessage.value = "";
  hydrating.value = false;
}

function resetForm() {
  templateOptions.value = [...assessmentTemplates];
  form.date = "";
  form.templateId = templateOptions.value[0]?.id ?? "";
  form.value = "";
  form.unit = templateOptions.value[0]?.defaultUnit ?? unitFallback.score;
  form.status = "";
  form.notes = "";
  errorMessage.value = "";
}

function handleSubmit() {
  const template = selectedTemplate.value;
  if (!template) {
    errorMessage.value = "请选择评估类型";
    return;
  }
  if (!form.date) {
    errorMessage.value = "请选择评估日期";
    return;
  }
  if (!form.status.trim()) {
    errorMessage.value = "请填写当前状态";
    return;
  }
  const rawValue = typeof form.value === "string" ? form.value.trim() : String(form.value ?? "").trim();
  if (!rawValue.length) {
    errorMessage.value = "请填写有效的数值";
    return;
  }
  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    errorMessage.value = "请填写有效的数值";
    return;
  }

  const unit = unitOptions.value.length ? form.unit || unitOptions.value[0] : template.defaultUnit;

  const payload: AssessmentPayload = {
    date: form.date,
    templateId: template.id,
    label: template.label,
    metric: template.metric,
    value: numericValue,
    unit,
    status: form.status.trim(),
    notes: form.notes.trim() ? form.notes.trim() : undefined
  };

  const id = isEditing.value && props.assessment ? props.assessment.id : undefined;
  emit("submit", { id, data: payload });
}

function confirmDelete() {
  if (!isEditing.value || !props.assessment) return;
  emit("delete", props.assessment.id);
}

function emitClose() {
  emit("close");
}
</script>

<style scoped>
.input {
  @apply w-full rounded-2xl border border-outline border-opacity-40 bg-surface-muted px-4 py-3 text-sm text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-30;
}
</style>


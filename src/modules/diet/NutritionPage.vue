<template>
  <section class="space-y-6 py-6">
    <PageHeader
      eyebrow="Biomarker Tracking"
      title="评估指标"
      description="集中记录量表得分与生物标志物，追踪 tau / Aβ 的变化趋势。"
    />

    <Transition name="fade">
      <div
        v-if="feedback.visible"
        class="rounded-3xl border border-outline/30 bg-surface-muted/60 px-5 py-3 text-xs"
        :class="feedback.tone === 'success' ? 'text-success' : feedback.tone === 'warning' ? 'text-danger' : 'text-primary'"
      >
        {{ feedback.message }}
      </div>
    </Transition>

    <div class="grid gap-5 lg:grid-cols-[1.2fr,1fr]">
      <UiCard padding="p-6" class="space-y-5">
        <header class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <h3 class="text-base font-semibold text-content">评估时间线</h3>
            <p class="text-xs text-content/60">按评估类型查看每次测评的数值与状态。</p>
          </div>
          <button
            type="button"
            class="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-medium text-white transition hover:bg-primary/90"
            @click="openCreate"
          >
            <PlusIcon class="h-4 w-4" />
            新增评估
          </button>
        </header>

        <div class="flex flex-wrap items-center gap-3 text-[11px] text-content/60">
          <label class="flex items-center gap-2">
            <span>评估类型</span>
            <select v-model="timelineTemplateId" class="filter-control">
              <option value="all">全部</option>
              <option
                v-for="option in templateOptions"
                :key="option.id"
                :value="option.id"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>

        <div
          v-if="!timelineEntries.length"
          class="grid min-h-[220px] place-items-center rounded-3xl border border-dashed border-outline border-opacity-40 bg-surface-muted/50 px-6 text-xs text-content/60"
        >
          暂无评估记录，可点击右上角按钮补充一次测评。
        </div>

        <ol v-else class="space-y-4">
          <li
            v-for="entry in timelineEntries"
            :key="entry.id"
            class="rounded-3xl border border-outline/20 bg-surface-muted/40 px-5 py-4 shadow-soft"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="space-y-1">
                <p class="text-sm font-semibold text-content">
                  {{ entry.label }} · {{ formatDate(entry.date) }}
                </p>
                <p class="text-xs text-content/60">{{ entry.status }}</p>
              </div>
              <div class="flex items-center gap-2">
                <UiIconButton aria-label="编辑评估" @click="openEdit(entry.id)">
                  <PencilSquareIcon class="h-4 w-4" />
                </UiIconButton>
                <UiIconButton
                  aria-label="删除评估"
                  class="text-danger"
                  @click="requestDelete(entry.id)"
                >
                  <TrashIcon class="h-4 w-4" />
                </UiIconButton>
              </div>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-content/70">
              <span>{{ metricLabels[entry.metric] }}：{{ formatEntryValue(entry) }}</span>
            </div>
            <p v-if="entry.notes" class="mt-3 text-xs leading-relaxed text-content/70">
              {{ entry.notes }}
            </p>
          </li>
        </ol>
      </UiCard>

      <UiCard padding="p-6" class="space-y-4">
        <div class="flex flex-wrap items-center gap-3 text-[11px] text-content/60">
          <label class="flex items-center gap-2">
            <span>图表评估</span>
            <select v-model="chartTemplateId" class="filter-control">
              <option value="">请选择</option>
              <option
                v-for="option in templateOptions"
                :key="option.id"
                :value="option.id"
                :disabled="!option.hasData"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>

        <PatientProgressChart
          :assessments="assessments"
          :template-id="chartTemplateId || null"
          :templates="assessmentTemplates"
        />
      </UiCard>
    </div>

    <PatientAssessmentSheet
      :open="workspace.open"
      :mode="workspace.mode"
      :assessment="selectedAssessment"
      @close="closeWorkspace"
      @submit="handleWorkspaceSubmit"
      @delete="handleWorkspaceDelete"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/vue/24/outline";

import UiCard from "@/components/atoms/UiCard.vue";
import UiIconButton from "@/components/atoms/UiIconButton.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import PatientAssessmentSheet from "@/modules/diet/components/PatientAssessmentSheet.vue";
import PatientProgressChart from "@/modules/diet/components/PatientProgressChart.vue";
import { usePatientStore, assessmentTemplates } from "@/stores/patient";
import type { AssessmentMetric, AssessmentTemplate, PatientAssessment } from "@/stores/patient";

const metricLabels: Record<AssessmentMetric, string> = {
  score: "认知得分",
  tau: "Tau 蛋白",
  amyloid: "Aβ 蛋白"
};

const store = usePatientStore();

onMounted(() => {
  if (store.assessmentsState === "idle") {
    store.fetchAssessments();
  }
  if (store.profileState === "idle") {
    store.fetchProfile();
  }
});
const assessments = computed(() => store.assessments);

const timelineTemplateId = ref<string>("all");
const chartTemplateId = ref<string>("");

const templateOptions = computed(() =>
  assessmentTemplates.map((template) => ({
    ...template,
    hasData: assessments.value.some((entry) => entry.templateId === template.id)
  }))
);

watch(
  templateOptions,
  (options) => {
    if (timelineTemplateId.value !== "all" && !options.some((item) => item.id === timelineTemplateId.value)) {
      timelineTemplateId.value = "all";
    }
  },
  { immediate: true }
);

watch(
  [templateOptions, assessments],
  () => {
    const available = templateOptions.value.filter((item) => item.hasData);
    if (!available.length) {
      chartTemplateId.value = "";
      return;
    }
    if (!available.some((item) => item.id === chartTemplateId.value)) {
      chartTemplateId.value = available[0].id;
    }
  },
  { immediate: true }
);

watch(
  timelineTemplateId,
  (value) => {
    if (value === "all") return;
    const option = templateOptions.value.find((item) => item.id === value && item.hasData);
    if (option) {
      chartTemplateId.value = option.id;
    }
  }
);

const templateMap = computed(() => new Map<string, AssessmentTemplate>(templateOptions.value.map((item) => [item.id, item])));

const timelineEntries = computed(() => {
  const selected = timelineTemplateId.value;
  const list = selected === "all"
    ? [...assessments.value]
    : assessments.value.filter((entry) => entry.templateId === selected);
  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

const workspace = reactive({
  open: false,
  mode: "create" as "create" | "edit",
  assessmentId: null as string | null
});

const feedback = reactive({
  visible: false,
  message: "",
  tone: "info" as "success" | "warning" | "info"
});

const selectedAssessment = computed<PatientAssessment | null>(() => {
  if (!workspace.assessmentId) return null;
  return assessments.value.find((entry) => entry.id === workspace.assessmentId) ?? null;
});

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

function openCreate() {
  workspace.mode = "create";
  workspace.assessmentId = null;
  workspace.open = true;
}

function openEdit(id: string) {
  workspace.mode = "edit";
  workspace.assessmentId = id;
  workspace.open = true;
}

function closeWorkspace() {
  workspace.open = false;
  workspace.assessmentId = null;
  workspace.mode = "create";
}

async function handleWorkspaceSubmit(payload: { id?: string; data: AssessmentPayload }) {
  const { id, data } = payload;
  try {
    if (id) {
      await store.updateAssessment(id, data);
      showFeedback("评估记录已更新", "success");
    } else {
      await store.addAssessment(data);
      showFeedback("新的评估记录已保存", "success");
    }
    closeWorkspace();
  } catch (error) {
    console.error(error);
    showFeedback("保存失败，请稍后重试", "warning");
  }
}

async function handleWorkspaceDelete(id: string) {
  await requestDelete(id);
}

async function requestDelete(id: string) {
  const confirmed = typeof window !== "undefined" ? window.confirm("确定要删除该评估记录吗？") : true;
  if (!confirmed) return;
  try {
    await store.removeAssessment(id);
    if (workspace.assessmentId === id) {
      closeWorkspace();
    }
    showFeedback("评估记录已删除", "warning");
  } catch (error) {
    console.error(error);
    showFeedback("删除失败，请稍后重试", "warning");
  }
}

function showFeedback(message: string, tone: "success" | "warning" | "info") {
  feedback.message = message;
  feedback.tone = tone;
  feedback.visible = true;
  window.setTimeout(() => {
    feedback.visible = false;
  }, 2500);
}

function formatEntryValue(entry: PatientAssessment) {
  if (entry.value === null) return "--";
  const template = templateMap.value.get(entry.templateId ?? "");
  const digits = entry.metric === "score" ? 1 : 2;
  const formatter = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: digits });
  const unit = entry.unit || template?.defaultUnit || "";
  return `${formatter.format(entry.value)} ${unit}`.trim();
}

function formatDate(value: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(date);
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.filter-control {
  @apply rounded-full border border-outline border-opacity-40 bg-surface-muted px-3 py-1 text-xs text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-30;
}
</style>







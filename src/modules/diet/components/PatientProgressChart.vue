<template>
  <div class="space-y-4">
    <header class="space-y-1">
      <h3 class="text-base font-semibold text-content">{{ headerTitle }}</h3>
      <p class="text-xs text-content/60">{{ headerDescription }}</p>
    </header>

    <div
      v-if="!activeTemplate || !chartPoints.length"
      class="grid min-h-[220px] place-items-center rounded-3xl border border-dashed border-outline/30 bg-surface-muted/40 px-4 text-center text-xs text-content/50"
    >
      {{ emptyMessage }}
    </div>

    <div v-else class="space-y-3">
      <div class="relative overflow-hidden rounded-3xl bg-surface-muted/40 p-4">
        <svg
          class="h-52 w-full"
          :viewBox="`0 0 ${viewWidth} ${viewHeight}`"
          role="img"
          :aria-label="`${activeTemplate.label} 的趋势图`"
        >
          <defs>
            <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(59,130,246,0.45)" />
              <stop offset="100%" stop-color="rgba(59,130,246,0.05)" />
            </linearGradient>
          </defs>
          <path :d="areaPath" :fill="`url(#${gradientId})`" />
          <polyline
            :points="polylinePoints"
            fill="none"
            stroke="rgb(59,130,246)"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <g>
            <circle
              v-for="point in chartPoints"
              :key="point.id"
              :cx="point.x"
              :cy="point.y"
              r="6"
              class="fill-surface stroke-primary"
              stroke-width="2"
            />
          </g>
        </svg>
        <ul class="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-content/60">
          <li
            v-for="point in chartPoints"
            :key="`label-${point.id}`"
            class="flex min-w-[96px] flex-col gap-0.5"
          >
            <span class="truncate font-medium text-content/70">{{ point.label }}</span>
            <span class="truncate">{{ formatDate(point.date) }}</span>
            <span class="truncate text-content/50">{{ point.displayValue }}</span>
          </li>
        </ul>
      </div>

      <dl class="grid gap-3 rounded-3xl bg-surface-muted/30 px-4 py-3 text-xs text-content/60 sm:grid-cols-3">
        <div>
          <dt>最新{{ metricLabel }}</dt>
          <dd class="mt-1 text-lg font-semibold text-content">{{ latestValueText }}</dd>
        </div>
        <div>
          <dt>相邻变化</dt>
          <dd
            class="mt-1 text-sm font-semibold"
            :class="valueDelta > 0 ? 'text-danger' : valueDelta < 0 ? 'text-success' : 'text-content'"
          >
            {{ trendText }}
          </dd>
        </div>
        <div>
          <dt>记录区间</dt>
          <dd class="mt-1 text-sm font-semibold text-content">{{ rangeText }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { AssessmentMetric, AssessmentTemplate, PatientAssessment } from "@/stores/patient";

type ChartPoint = {
  id: string;
  x: number;
  y: number;
  date: string;
  label: string;
  rawValue: number;
  unit: string;
  displayValue: string;
};

type MetricKey = AssessmentMetric;

const metricLabels: Record<MetricKey, string> = {
  score: "认知得分",
  tau: "Tau 蛋白",
  amyloid: "Aβ 蛋白"
};

const precisionMap: Record<MetricKey, number> = {
  score: 1,
  tau: 2,
  amyloid: 2
};

const props = defineProps<{
  assessments: PatientAssessment[];
  templateId: string | null;
  templates: AssessmentTemplate[];
}>();

const viewWidth = 560;
const viewHeight = 240;
const paddingX = 36;
const paddingY = 28;
const gradientId = "patient-progress-gradient";

const templateMap = computed(() => new Map(props.templates.map((template) => [template.id, template])));

const activeTemplate = computed(() => {
  if (!props.templateId) return null;
  return templateMap.value.get(props.templateId) ?? null;
});

const metricKey = computed<MetricKey>(() => activeTemplate.value?.metric ?? "score");

const headerTitle = computed(() => activeTemplate.value?.label ?? "未选择评估");
const headerDescription = computed(() =>
  activeTemplate.value ? `${metricLabels[metricKey.value]}的时间序列对比。` : "请选择评估类型查看趋势图"
);
const emptyMessage = computed(() =>
  activeTemplate.value ? "暂无对应数据，尝试补充记录。" : "尚未选择评估类型。"
);
const metricLabel = computed(() => metricLabels[metricKey.value]);

const relevantAssessments = computed(() => {
  if (!activeTemplate.value) return [] as PatientAssessment[];
  return props.assessments
    .filter((entry) => entry.templateId === activeTemplate.value!.id && entry.value !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
});

const chartPoints = computed<ChartPoint[]>(() => {
  if (!activeTemplate.value) return [];
  const values = relevantAssessments.value;
  if (!values.length) return [];

  const min = Math.min(...values.map((item) => item.value ?? 0));
  const max = Math.max(...values.map((item) => item.value ?? 0));
  const span = Math.max(max - min, Math.abs(max) * 0.1, 1);
  const usableWidth = viewWidth - paddingX * 2;
  const usableHeight = viewHeight - paddingY * 2;

  return values.map((entry, index) => {
    const progress = values.length === 1 ? 0.5 : index / (values.length - 1);
    const x = paddingX + usableWidth * progress;
    const value = entry.value ?? 0;
    const y = viewHeight - paddingY - ((value - min) / span) * usableHeight;
    const unit = entry.unit || activeTemplate.value?.defaultUnit || "";

    return {
      id: entry.id,
      x,
      y,
      date: entry.date,
      label: entry.label,
      rawValue: value,
      unit,
      displayValue: formatValue(value, unit)
    };
  });
});

const polylinePoints = computed(() => chartPoints.value.map((point) => `${point.x},${point.y}`).join(" "));

const areaPath = computed(() => {
  const points = chartPoints.value;
  if (!points.length) return "";
  const baseY = viewHeight - paddingY;
  const start = `M ${points[0].x} ${baseY}`;
  const middle = points.map((point) => `L ${point.x} ${point.y}`).join(" ");
  const end = `L ${points[points.length - 1].x} ${baseY} Z`;
  return `${start} ${middle} ${end}`;
});

const latestPoint = computed(() => chartPoints.value.at(-1) ?? null);
const previousPoint = computed(() => (chartPoints.value.length > 1 ? chartPoints.value.at(-2) ?? null : null));

const latestValueText = computed(() => {
  if (!latestPoint.value) return "--";
  return latestPoint.value.displayValue;
});

const valueDelta = computed(() => {
  if (!latestPoint.value || !previousPoint.value) return 0;
  return Number((latestPoint.value.rawValue - previousPoint.value.rawValue).toFixed(precisionMap[metricKey.value]));
});

const trendText = computed(() => {
  if (!latestPoint.value) return "无数据";
  if (!previousPoint.value) return "首次记录";
  if (valueDelta.value > 0) {
    return `↑ 上升 ${formatValue(Math.abs(valueDelta.value), latestPoint.value.unit)}`;
  }
  if (valueDelta.value < 0) {
    return `↓ 下降 ${formatValue(Math.abs(valueDelta.value), latestPoint.value.unit)}`;
  }
  return "↔ 与上一轮持平";
});

const rangeText = computed(() => {
  if (!relevantAssessments.value.length) return "--";
  const first = relevantAssessments.value[0];
  const last = relevantAssessments.value[relevantAssessments.value.length - 1];
  const start = formatDate(first.date);
  const end = formatDate(last.date);
  return start === end ? start : `${start} 至 ${end}`;
});

function formatValue(value: number, unit?: string) {
  const formatter = new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: precisionMap[metricKey.value]
  });
  return unit ? `${formatter.format(value)} ${unit}`.trim() : formatter.format(value);
}

function formatDate(value: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(date);
}
</script>

<template>
  <UiCard class="space-y-4" hoverable>
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-[0.3em] text-primary/70">{{ task.category }}</p>
        <h3 class="text-lg font-semibold text-content">{{ task.title }}</h3>
        <p class="text-sm text-content/60">{{ frequencyLabel }}</p>
      </div>
      <button
        type="button"
        class="rounded-full border border-outline/50 px-3 py-1 text-xs text-content/70 transition hover:border-primary/50 hover:text-primary"
      >
        {{ priorityLabel }}
      </button>
    </div>

    <div class="flex flex-col gap-3 text-sm text-content/70">
      <div class="flex items-center gap-2">
        <ClockIcon class="h-4 w-4" />
        <span>提醒时间：{{ startTime }}（提前 {{ task.reminderLead }} 分钟）</span>
      </div>
      <div class="flex items-center gap-2">
        <DevicePhoneMobileIcon class="h-4 w-4" />
        <span>通知渠道：{{ task.reminderChannel.join('、') }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <button
        type="button"
        class="text-xs font-medium text-primary underline-offset-2 hover:underline"
        @click="handleDetail"
      >
        查看详情
      </button>
      <button class="primary-button" type="button" @click="handleComplete">
        标记完成
      </button>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ClockIcon, DevicePhoneMobileIcon } from "@heroicons/vue/24/outline";

import UiCard from "@/components/atoms/UiCard.vue";
import type { CareTask } from "@/stores/tasks";

const props = defineProps<{ task: CareTask }>();

const emit = defineEmits<{
  (e: "complete", id: string): void;
  (e: "detail", id: string): void;
}>();

const frequencyMap: Record<string, string> = {
  once: "一次性提醒",
  daily: "每日重复",
  weekly: "每周重复",
  monthly: "每月重复",
  custom: "自定义频率"
};

const priorityMap: Record<string, string> = {
  low: "优先级：低",
  medium: "优先级：中",
  high: "优先级：高"
};

const frequencyLabel = computed(() => frequencyMap[props.task.frequency] ?? "自定义计划");
const priorityLabel = computed(() => priorityMap[props.task.priority] ?? "优先级");
const startTime = computed(() =>
  new Date(props.task.startAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
);

function handleComplete() {
  emit("complete", props.task.id);
}

function handleDetail() {
  emit("detail", props.task.id);
}
</script>

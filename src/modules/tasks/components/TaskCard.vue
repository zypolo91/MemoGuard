<template>
  <UiCard class="space-y-4">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-[0.3em] text-primary/70">{{ task.category }}</p>
        <h3 class="text-lg font-semibold text-content">{{ task.title }}</h3>
        <p class="text-sm text-content/60">{{ frequencyLabel }}</p>
      </div>
      <div class="flex items-center gap-2 text-content/60">
        <UiIconButton aria-label="编辑任务" @click="emit('edit', task)">
          <PencilSquareIcon class="h-4 w-4" />
        </UiIconButton>
        <UiIconButton aria-label="删除任务" class="hover:text-danger" @click="emit('delete', task)">
          <TrashIcon class="h-4 w-4" />
        </UiIconButton>
      </div>
    </div>

    <div class="flex flex-col gap-3 text-sm text-content/70">
      <div class="flex items-center gap-2">
        <ClockIcon class="h-4 w-4" />
        <span>提醒时间：{{ startTime }}，提前 {{ task.reminderLead }} 分钟</span>
      </div>
      <div class="flex items-center gap-2">
        <DevicePhoneMobileIcon class="h-4 w-4" />
        <span>通知方式：{{ task.reminderChannel.join('、') }}</span>
      </div>
      <p v-if="task.notes" class="rounded-2xl bg-surface-muted/60 px-4 py-2 text-xs text-content/60">{{ task.notes }}</p>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ClockIcon, DevicePhoneMobileIcon, PencilSquareIcon, TrashIcon } from "@heroicons/vue/24/outline";

import UiCard from "@/components/atoms/UiCard.vue";
import UiIconButton from "@/components/atoms/UiIconButton.vue";
import type { CareTask } from "@/stores/tasks";

const props = defineProps<{ task: CareTask }>();

const emit = defineEmits<{
  (e: "edit", task: CareTask): void;
  (e: "delete", task: CareTask): void;
}>();

const frequencyMap: Record<string, string> = {
  once: "一次提醒",
  daily: "每天重复",
  weekly: "每周重复",
  monthly: "每月重复",
  custom: "自定义频率"
};

const frequencyLabel = computed(() => frequencyMap[String(props.task.frequency)] ?? "自定义安排");
const startTime = computed(() =>
  new Date(props.task.startAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" })
);
</script>

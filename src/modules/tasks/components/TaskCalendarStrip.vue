<template>
  <UiCard class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-content">近七日执行概览</h3>
      <span class="text-xs text-content/60">完成率 {{ completionRate }}%</span>
    </div>
    <div class="flex items-end gap-4">
      <div
        v-for="day in timeline"
        :key="day.date"
        class="flex flex-1 flex-col items-center gap-2 text-xs text-content/70"
      >
        <div
          class="flex w-full items-end justify-center rounded-t-xl bg-primary/10"
          :style="{ height: `${Math.max(day.completed * 18, 8)}px` }"
        >
          <span class="mb-1 text-[11px] font-medium text-primary">{{ day.completed }}</span>
        </div>
        <span>{{ day.label }}</span>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";

import UiCard from "@/components/atoms/UiCard.vue";
import type { CareTask } from "@/stores/tasks";

const props = defineProps<{ tasks: CareTask[] }>();

const timeline = computed(() => {
  const now = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    const completed = props.tasks.filter((task) =>
      task.statusHistory?.some((history) => {
        const historyDate = new Date(history.timestamp);
        return (
          history.status === "completed" &&
          historyDate.getFullYear() === date.getFullYear() &&
          historyDate.getMonth() === date.getMonth() &&
          historyDate.getDate() === date.getDate()
        );
      })
    ).length;
    return {
      date: date.toISOString().slice(0, 10),
      label,
      completed
    };
  });
});

const completionRate = computed(() => {
  const total = props.tasks.length;
  if (!total) return 0;
  const completed = props.tasks.filter((task) =>
    task.statusHistory?.some((history) => history.status === "completed")
  ).length;
  return Math.round((completed / total) * 100);
});
</script>

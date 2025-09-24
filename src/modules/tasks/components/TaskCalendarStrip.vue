<template>
  <UiCard class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-content">提醒日历</h3>
      <span class="text-xs text-content/60">完成率 {{ completionRate }}%</span>
    </div>
    <div class="flex gap-3 overflow-x-auto pb-1">
      <button
        v-for="day in timeline"
        :key="day.date"
        type="button"
        class="flex w-14 flex-col items-center gap-2 text-xs text-content/70 transition hover:text-primary focus:outline-none"
        :class="{ 'text-primary': selectedDate === day.date }"
        @click="emit('select-day', day.date)"
      >
        <div
          class="flex w-full items-end justify-center rounded-t-xl bg-primary/10 transition"
          :class="{ 'bg-primary/20': selectedDate === day.date }"
          :style="{ height: `${Math.max(day.scheduled * 16, 8)}px` }"
        >
          <span class="mb-1 text-[11px] font-medium text-primary">{{ day.scheduled }}</span>
        </div>
        <span>{{ day.label }}</span>
      </button>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";

import UiCard from "@/components/atoms/UiCard.vue";
import type { CareTask, ReminderLogEntry } from "@/stores/tasks";

type CalendarDay = {
  date: string;
  label: string;
  scheduled: number;
  completed: number;
};

const props = defineProps<{ tasks: CareTask[]; entries?: ReminderLogEntry[]; selectedDate?: string }>();

const emit = defineEmits<{ (e: "select-day", date: string): void }>();

function toDateKey(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(key: string) {
  return new Date(`${key}T00:00:00`);
}

const timeline = computed<CalendarDay[]>(() => {
  const todayKey = toDateKey(new Date().toISOString());
  const tasksByDate = new Map<string, CareTask[]>();
  const entriesByDate = new Map<string, ReminderLogEntry[]>();

  props.tasks.forEach((task) => {
    const key = toDateKey(task.startAt);
    if (!key) return;
    if (!tasksByDate.has(key)) {
      tasksByDate.set(key, []);
    }
    tasksByDate.get(key)!.push(task);
  });

  (props.entries ?? []).forEach((entry) => {
    const key = toDateKey(entry.timestamp);
    if (!key) return;
    if (!entriesByDate.has(key)) {
      entriesByDate.set(key, []);
    }
    entriesByDate.get(key)!.push(entry);
  });

  const keySet = new Set<string>();
  tasksByDate.forEach((_, key) => keySet.add(key));
  entriesByDate.forEach((_, key) => keySet.add(key));
  keySet.add(todayKey);

  const keys = Array.from(keySet)
    .filter((key) => key)
    .sort((a, b) => dateFromKey(a).getTime() - dateFromKey(b).getTime())
    .slice(0, 14);

  return keys.map((key) => {
    const date = new Date(`${key}T00:00:00`);
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    const tasksForDay = tasksByDate.get(key) ?? [];
    const logsForDay = entriesByDate.get(key) ?? [];
    const taskIds = new Set(tasksForDay.map((task) => task.id));
    const extraLogs = logsForDay.filter((entry) => !taskIds.has(entry.taskId));
    const completed = logsForDay.filter((entry) => entry.status === "completed").length;
    return {
      date: key,
      label,
      scheduled: tasksForDay.length + extraLogs.length,
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

const selectedDate = computed(() => props.selectedDate ?? timeline.value[0]?.date ?? "");
</script>

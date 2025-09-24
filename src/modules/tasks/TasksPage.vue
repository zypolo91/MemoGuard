<template>
  <section class="space-y-6 pb-24">
    <PageHeader
      eyebrow="Care Tasks"
      title="关怀任务"
      description="集中管理关怀提醒，随时掌握今日与全部安排。"
    />

    <section class="space-y-2">
      <TaskCalendarStrip
        :tasks="tasks"
        :entries="reminderEntries"
        :selected-date="selectedOverviewDate"
        @select-day="handleSelectDay"
      />
      <p class="text-xs text-content/60">点击日期查看当天的提醒详情</p>
    </section>

    <SegmentedControl v-model="taskFilter" :options="filterOptions" />

    <div v-if="displayedTasks.length" class="space-y-4">
      <TaskList :tasks="displayedTasks" @edit="openTaskComposer" @delete="prepareDeleteTask" />
    </div>
    <p v-else class="rounded-2xl bg-surface-muted/60 px-6 py-10 text-center text-sm text-content/60">
      当前筛选下暂无关怀任务，点击右下角按钮即可创建。
    </p>

    <TaskComposerSheet :open="isComposerOpen" :task="editingTask" @close="closeComposer" @submit="handleTaskSubmit" />
    <TaskDayDetailSheet
      :open="isDayDetailOpen"
      :date="selectedOverviewDate"
      :entries="selectedDayEntries"
      @close="closeDayDetail"
    />
    <TaskDeleteSheet
      :open="Boolean(taskPendingDelete)"
      :task="taskPendingDelete"
      @close="taskPendingDelete = null"
      @confirm="handleConfirmDelete"
    />

    <UiFab aria-label="新增关怀任务" @click="openTaskComposer()">
      <PlusIcon class="h-6 w-6" />
    </UiFab>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { PlusIcon } from "@heroicons/vue/24/outline";

import UiFab from "@/components/atoms/UiFab.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import SegmentedControl from "@/components/molecules/SegmentedControl.vue";
import TaskCalendarStrip from "@/modules/tasks/components/TaskCalendarStrip.vue";
import TaskComposerSheet from "@/modules/tasks/components/TaskComposerSheet.vue";
import TaskDayDetailSheet from "@/modules/tasks/components/TaskDayDetailSheet.vue";
import TaskDeleteSheet from "@/modules/tasks/components/TaskDeleteSheet.vue";
import TaskList from "@/modules/tasks/components/TaskList.vue";
import { useTasksStore } from "@/stores/tasks";
import type { CareTask, ReminderLogEntry } from "@/stores/tasks";

const store = useTasksStore();

const taskFilter = ref<"today" | "all">("today");
const isComposerOpen = ref(false);
const editingTask = ref<CareTask | null>(null);
const taskPendingDelete = ref<CareTask | null>(null);
const selectedOverviewDate = ref<string | null>(null);
const isDayDetailOpen = ref(false);

const filterOptions = [
  { label: "今日", value: "today" },
  { label: "全部", value: "all" }
];

onMounted(() => {
  if (store.state === "idle") {
    store.fetchTasks();
  }
});

const tasks = computed(() => store.tasks);
const reminderEntries = computed(() => store.reminderLog);

const defaultCalendarDate = computed(() => {
  const todayKey = toDateKey(new Date().toISOString());
  const keys = new Set<string>();
  tasks.value.forEach((task) => {
    const key = toDateKey(task.startAt);
    if (key) keys.add(key);
  });
  reminderEntries.value.forEach((entry) => {
    const key = toDateKey(entry.timestamp);
    if (key) keys.add(key);
  });
  const sorted = Array.from(keys)
    .filter((key) => dateFromKey(key).getTime() >= dateFromKey(todayKey).getTime())
    .sort((a, b) => dateFromKey(a).getTime() - dateFromKey(b).getTime());
  return sorted[0] ?? todayKey;
});

watch(
  () => defaultCalendarDate.value,
  (value) => {
    if (!selectedOverviewDate.value && value) {
      selectedOverviewDate.value = value;
    }
  },
  { immediate: true }
);

const displayedTasks = computed(() => {
  if (taskFilter.value === "today") {
    return store.scheduledToday;
  }
  return tasks.value;
});

const selectedDayEntries = computed<ReminderLogEntry[]>(() => {
  if (!selectedOverviewDate.value) return [];
  const dateKey = selectedOverviewDate.value;

  const taskEntries = tasks.value
    .filter((task) => toDateKey(task.startAt) === dateKey)
    .map((task) => {
      const matchingLogs = reminderEntries.value
        .filter((entry) => entry.taskId === task.id && toDateKey(entry.timestamp) === dateKey)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (matchingLogs.length) {
        return matchingLogs[0];
      }

      return {
        id: `${task.id}-${dateKey}`,
        taskId: task.id,
        taskTitle: task.title,
        status: "pending" as ReminderLogEntry["status"],
        timestamp: task.startAt
      };
    });

  const extraEntries = reminderEntries.value.filter(
    (entry) =>
      toDateKey(entry.timestamp) === dateKey &&
      !tasks.value.some((task) => task.id === entry.taskId && toDateKey(task.startAt) === dateKey)
  );

  return [...taskEntries, ...extraEntries];
});

function openTaskComposer(task?: CareTask) {
  editingTask.value = task ?? null;
  isComposerOpen.value = true;
}

function closeComposer() {
  isComposerOpen.value = false;
  editingTask.value = null;
}

function prepareDeleteTask(task: CareTask) {
  taskPendingDelete.value = task;
}

function handleConfirmDelete(id: string) {
  if (!id) return;
  store.removeTask(id);
  taskPendingDelete.value = null;
}

function handleTaskSubmit(payload: {
  mode: "create" | "edit";
  id?: string;
  title: string;
  startAt: string;
  frequency: string;
  notes: string;
}) {
  if (payload.mode === "edit" && payload.id) {
    store.updateTask(payload.id, {
      title: payload.title,
      startAt: payload.startAt,
      frequency: payload.frequency,
      notes: payload.notes
    });
  } else {
    store.addTask({
      title: payload.title,
      startAt: payload.startAt,
      frequency: payload.frequency,
      notes: payload.notes
    });
  }
  closeComposer();
}

function handleSelectDay(date: string) {
  selectedOverviewDate.value = date;
  isDayDetailOpen.value = true;
}

function closeDayDetail() {
  isDayDetailOpen.value = false;
}

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
</script>



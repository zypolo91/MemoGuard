<template>
  <section class="space-y-6 py-6">
    <PageHeader
      eyebrow="Care Tasks"
      title="关怀任务"
      description="用清晰的任务面板掌控照护节奏。"
    />

    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-content/70">任务视图</h2>
      <SegmentedControl v-model="activeView" :options="viewOptions" />
    </div>

    <div class="grid gap-5 lg:grid-cols-[2fr,1fr]">
      <div class="space-y-5">
        <TaskList :tasks="filteredTasks" @complete="handleComplete" />
      </div>
      <div class="space-y-5">
        <UiCard padding="p-6" class="space-y-3">
          <h3 class="text-base font-semibold text-content">即将提醒</h3>
          <ul class="space-y-3 text-sm text-content/70">
            <li v-for="item in upcoming" :key="item.id" class="flex items-center justify-between">
              <span>{{ item.title }}</span>
              <span class="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{{
                formatTime(item.startAt)
              }}</span>
            </li>
          </ul>
          <p v-if="!upcoming.length" class="text-sm text-content/60">暂无近期开启的提醒。</p>
        </UiCard>
        <TaskCalendarStrip :tasks="tasks" />
        <ReminderLog :entries="reminderLog" />
      </div>
    </div>

    <TaskComposerSheet
      :open="isComposerOpen"
      @close="toggleComposer(false)"
      @submit="handleCreate"
    />
    <UiFab @click="toggleComposer(true)">
      <PlusIcon class="h-6 w-6" />
    </UiFab>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { PlusIcon } from "@heroicons/vue/24/outline";

import UiCard from "@/components/atoms/UiCard.vue";
import UiFab from "@/components/atoms/UiFab.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import SegmentedControl from "@/components/molecules/SegmentedControl.vue";
import ReminderLog from "@/modules/tasks/components/ReminderLog.vue";
import TaskCalendarStrip from "@/modules/tasks/components/TaskCalendarStrip.vue";
import TaskComposerSheet from "@/modules/tasks/components/TaskComposerSheet.vue";
import TaskList from "@/modules/tasks/components/TaskList.vue";
import { useTasksStore } from "@/stores/tasks";

const store = useTasksStore();

const activeView = ref("today");
const isComposerOpen = ref(false);

const viewOptions = [
  { label: "今日", value: "today" },
  { label: "全部", value: "all" },
  { label: "完成记录", value: "history" },
];

onMounted(() => {
  if (store.state === "idle") {
    store.fetchTasks();
  }
});

const tasks = computed(() => store.tasks);
const reminderLog = computed(() => store.reminderLog);
const upcoming = computed(() => store.upcoming);
const todayCount = computed(() => store.scheduledToday.length);

const filteredTasks = computed(() => {
  if (activeView.value === "today") {
    return store.scheduledToday;
  }
  if (activeView.value === "history") {
    return store.tasks.filter((task) =>
      task.statusHistory.some((history) => history.status === "completed"),
    );
  }
  return store.tasks;
});

const completionRate = computed(() => {
  const total = store.tasks.length;
  if (!total) return 0;
  const completed = store.tasks.filter((task) =>
    task.statusHistory?.some((history) => history.status === "completed"),
  ).length;
  return Math.round((completed / total) * 100);
});

const nextReminder = computed(() => {
  if (!upcoming.value.length) return "--";
  return formatTime(upcoming.value[0]?.startAt ?? "");
});

function handleComplete(id: string) {
  store.markCompleted(id);
}

function handleCreate(payload: {
  title: string;
  startAt: string;
  frequency: string;
  notes?: string;
}) {
  store.addTask(payload);
}

function toggleComposer(open: boolean) {
  isComposerOpen.value = open;
}

function formatTime(value: string) {
  if (!value) return "--";
  return new Date(value).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" });
}
</script>

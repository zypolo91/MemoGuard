import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";

import { listTasks } from "@/services/mockApi/tasks";
import { loadState, saveState } from "@/utils/storage";

type TaskFrequency = "once" | "daily" | "weekly" | "monthly" | "custom";

type TaskStatus = "pending" | "completed" | "skipped" | "snoozed";

export interface TaskHistory {
  status: TaskStatus;
  timestamp: string;
}

export interface CareTask {
  id: string;
  title: string;
  category: string;
  frequency: TaskFrequency | string;
  startAt: string;
  endAt: string | null;
  priority: "low" | "medium" | "high";
  reminderLead: number;
  reminderChannel: string[];
  notes?: string;
  statusHistory: TaskHistory[];
}

interface TaskDraft {
  title: string;
  startAt: string;
  frequency: string;
  notes?: string;
}

const STORAGE_KEY = "tasks";

export const useTasksStore = defineStore("tasks", () => {
  const tasks = ref<CareTask[]>(loadState<CareTask[]>(STORAGE_KEY, []));
  const state = ref<"idle" | "loading" | "success" | "error">(tasks.value.length ? "success" : "idle");
  const error = ref<string | null>(null);

  const scheduledToday = computed(() =>
    tasks.value.filter((task) => new Date(task.startAt).toDateString() === new Date().toDateString())
  );

  const upcoming = computed(() =>
    [...tasks.value].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()).slice(0, 5)
  );

  const reminderLog = computed(() =>
    tasks.value
      .flatMap((task) =>
        task.statusHistory.map((history) => ({
          title: task.title,
          status: history.status,
          timestamp: history.timestamp
        }))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
  );

  async function fetchTasks() {
    state.value = "loading";
    error.value = null;
    try {
      tasks.value = await listTasks();
      state.value = "success";
    } catch (err) {
      if (tasks.value.length) {
        state.value = "success";
        error.value = null;
        return;
      }
      state.value = "error";
      error.value = err instanceof Error ? err.message : "加载失败";
    }
  }

  function markCompleted(id: string) {
    const task = tasks.value.find((item) => item.id === id);
    if (!task) return;
    const timestamp = new Date().toISOString();
    task.statusHistory = [
      ...task.statusHistory,
      {
        status: "completed",
        timestamp
      }
    ];
  }

  function addTask(draft: TaskDraft) {
    const now = Date.now();
    const newTask: CareTask = {
      id: `t-${now}`,
      title: draft.title,
      category: "自定义",
      frequency: draft.frequency,
      startAt: draft.startAt,
      endAt: null,
      priority: "medium",
      reminderLead: 15,
      reminderChannel: ["app"],
      notes: draft.notes ?? "",
      statusHistory: []
    };
    tasks.value = [newTask, ...tasks.value];
  }

  watch(
    tasks,
    (value) => saveState(STORAGE_KEY, value),
    { deep: true }
  );

  return {
    tasks,
    state,
    error,
    scheduledToday,
    upcoming,
    reminderLog,
    fetchTasks,
    markCompleted,
    addTask
  };
});

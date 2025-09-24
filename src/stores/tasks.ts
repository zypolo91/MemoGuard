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

export interface ReminderLogEntry {
  id: string;
  taskId: string;
  taskTitle: string;
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

  const reminderLog = computed<ReminderLogEntry[]>(() => {
    const dedup = new Map<string, ReminderLogEntry>();
    tasks.value.forEach((task) => {
      task.statusHistory.forEach((history) => {
        const key = `${task.id}-${history.timestamp}`;
        if (!dedup.has(key)) {
          dedup.set(key, {
            id: key,
            taskId: task.id,
            taskTitle: task.title,
            status: history.status,
            timestamp: history.timestamp
          });
        }
      });
    });
    return Array.from(dedup.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

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

  function updateTask(id: string, updates: Partial<Omit<CareTask, "id">>) {
    tasks.value = tasks.value.map((task) => (task.id === id ? { ...task, ...updates } : task));
  }

  function removeTask(id: string) {
    tasks.value = tasks.value.filter((task) => task.id !== id);
  }

  function normalizeTimestamp(value?: string): string {
    if (!value) return new Date().toISOString();
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  }

  function ensureUniqueTimestamp(task: CareTask, desired: string, originalTimestamp?: string): string {
    const existing = new Set(task.statusHistory.map((history) => history.timestamp));
    if (originalTimestamp) {
      existing.delete(originalTimestamp);
    }
    let candidate = desired;
    while (existing.has(candidate)) {
      candidate = new Date(new Date(candidate).getTime() + 1000).toISOString();
    }
    return candidate;
  }

  function addReminderEntry(taskId: string, entry: TaskHistory) {
    const task = tasks.value.find((item) => item.id === taskId);
    if (!task) return;
    const normalized = normalizeTimestamp(entry.timestamp);
    const timestamp = ensureUniqueTimestamp(task, normalized);
    const nextEntry: TaskHistory = {
      status: entry.status,
      timestamp
    };
    task.statusHistory = [...task.statusHistory, nextEntry].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  function updateReminderEntry(taskId: string, originalTimestamp: string, updates: Partial<TaskHistory>) {
    const task = tasks.value.find((item) => item.id === taskId);
    if (!task) return;
    const normalized = updates.timestamp ? normalizeTimestamp(updates.timestamp) : originalTimestamp;
    const timestamp = ensureUniqueTimestamp(task, normalized, originalTimestamp);
    task.statusHistory = task.statusHistory.map((history) => {
      if (history.timestamp !== originalTimestamp) return history;
      return {
        status: updates.status ?? history.status,
        timestamp
      };
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  function removeReminderEntry(taskId: string, timestamp: string) {
    const task = tasks.value.find((item) => item.id === taskId);
    if (!task) return;
    task.statusHistory = task.statusHistory.filter((history) => history.timestamp !== timestamp);
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
    addTask,
    updateTask,
    removeTask,
    addReminderEntry,
    updateReminderEntry,
    removeReminderEntry
  };
});




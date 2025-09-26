import { apiFetch } from "./client";
import type { TaskPayload, TaskUpdatePayload } from "@/lib/dto/tasks";

export interface TaskReminderRecord {
  id: string;
  status: string;
  timestamp: string;
  notes?: string | null;
}

export interface TaskHistoryRecord {
  id: string;
  status: string;
  changedAt: string;
  payload?: Record<string, unknown> | null;
}

export interface TaskRecord {
  id: string;
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high";
  frequency?: string | null;
  dueAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reminders: TaskReminderRecord[];
  history: TaskHistoryRecord[];
}

export async function listTasks() {
  return apiFetch<TaskRecord[]>("/api/tasks");
}

export async function createTask(payload: TaskPayload) {
  return apiFetch<TaskRecord>("/api/tasks", {
    method: "POST",
    json: payload
  });
}

export async function updateTask(id: string, payload: TaskUpdatePayload) {
  return apiFetch<TaskRecord>(`/api/tasks/${id}`, {
    method: "PATCH",
    json: payload
  });
}

export async function deleteTask(id: string) {
  await apiFetch<void>(`/api/tasks/${id}`, {
    method: "DELETE"
  });
}

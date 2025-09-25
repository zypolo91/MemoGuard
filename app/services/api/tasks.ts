import { apiFetch } from "./client";

export interface RemoteTaskHistory {
  status: string;
  timestamp: string;
}

export interface RemoteCareTask {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  frequency?: string | null;
  dueAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reminders: RemoteTaskHistory[];
  history: RemoteTaskHistory[];
}

export async function fetchTasks() {
  return apiFetch<RemoteCareTask[]>("/tasks", { method: "GET" });
}

import { apiFetch } from "./client";
import type { UserCreatePayload, UserQuery, UserUpdatePayload } from "@/lib/dto/users";

export interface UserRecord {
  id: string;
  email: string;
  phone?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  role: "patient" | "caregiver" | "family" | "guest";
  status: "invited" | "active" | "inactive" | "suspended";
  metadata: Record<string, unknown>;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  data: UserRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export type UserListParams = UserQuery;

function toSearchParams(params: UserListParams = {}) {
  const search = new URLSearchParams();
  if (params.role) search.set("role", params.role);
  if (params.status) search.set("status", params.status);
  if (params.search) search.set("search", params.search);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  return search;
}

export async function listUsers(params: UserListParams = {}) {
  const search = toSearchParams(params);
  const query = search.toString();
  return apiFetch<UserListResponse>(`/api/users${query ? `?${query}` : ""}`);
}

export async function createUser(payload: UserCreatePayload) {
  return apiFetch<UserRecord>("/api/users", {
    method: "POST",
    json: payload
  });
}

export async function updateUser(id: string, payload: UserUpdatePayload) {
  return apiFetch<UserRecord>(`/api/users/${id}`, {
    method: "PATCH",
    json: payload
  });
}

export async function deleteUser(id: string) {
  await apiFetch<void>(`/api/users/${id}`, {
    method: "DELETE"
  });
}

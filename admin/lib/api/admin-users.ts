import { apiFetch } from "./client";
import type {
  AdminUserCreatePayload,
  AdminUserQuery,
  AdminUserUpdatePayload
} from "@/lib/dto/admin-users";

export interface AdminUserRecord {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  role: "superadmin" | "manager" | "editor" | "viewer";
  status: "active" | "inactive" | "suspended";
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListResponse {
  data: AdminUserRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export type AdminUserListParams = AdminUserQuery;

function toSearchParams(params: AdminUserListParams = {}) {
  const search = new URLSearchParams();
  if (params.role) search.set("role", params.role);
  if (params.status) search.set("status", params.status);
  if (params.search) search.set("search", params.search);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  return search;
}

export async function listAdminUsers(params: AdminUserListParams = {}) {
  const search = toSearchParams(params);
  const query = search.toString();
  return apiFetch<AdminUserListResponse>(`/api/admin-users${query ? `?${query}` : ""}`);
}

export async function createAdminUser(payload: AdminUserCreatePayload) {
  return apiFetch<AdminUserRecord>("/api/admin-users", {
    method: "POST",
    json: payload
  });
}

export async function updateAdminUser(id: string, payload: AdminUserUpdatePayload) {
  return apiFetch<AdminUserRecord>(`/api/admin-users/${id}`, {
    method: "PATCH",
    json: payload
  });
}

export async function deleteAdminUser(id: string) {
  await apiFetch<void>(`/api/admin-users/${id}`, {
    method: "DELETE"
  });
}

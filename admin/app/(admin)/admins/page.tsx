"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  updateAdminUser,
  type AdminUserRecord,
  type AdminUserListParams
} from "@/lib/api/admin-users";
import type { AdminUserCreatePayload, AdminUserUpdatePayload } from "@/lib/dto/admin-users";

const adminRoles = [
  { value: "superadmin", label: "超级管理员" },
  { value: "manager", label: "运营管理员" },
  { value: "editor", label: "内容编辑" },
  { value: "viewer", label: "只读访客" }
] as const;

const adminStatuses = [
  { value: "active", label: "启用" },
  { value: "inactive", label: "停用" },
  { value: "suspended", label: "封禁" }
] as const;

type AdminRoleValue = (typeof adminRoles)[number]["value"];
type AdminStatusValue = (typeof adminStatuses)[number]["value"];

type AdminFilterState = {
  role: "all" | AdminRoleValue;
  status: "all" | AdminStatusValue;
  search: string;
  page: number;
  pageSize: number;
};

const usernamePattern = /^[a-zA-Z0-9_.-]+$/u;

const adminFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "用户名至少 3 个字符")
    .max(48, "用户名不超过 48 个字符")
    .regex(usernamePattern, "仅支持字母、数字和 ._-"),
  displayName: z.string().trim().min(1, "请输入显示名称").max(120, "显示名称不超过 120 个字符"),
  email: z.string().trim().email("请输入有效邮箱").optional().or(z.literal("")),
  role: z.enum(["superadmin", "manager", "editor", "viewer"] as const),
  status: z.enum(["active", "inactive", "suspended"] as const),
  password: z.string().min(8, "密码至少 8 位").max(128, "密码不超过 128 位").optional().or(z.literal(""))
});

type AdminFormValues = z.infer<typeof adminFormSchema>;

type AdminFormSubmit = (
  values: AdminFormValues,
  helpers: { setFieldError: (field: keyof AdminFormValues, message: string) => void }
) => void;

type AdminFormMode = "create" | "edit";

function roleLabel(value: AdminRoleValue) {
  return adminRoles.find((item) => item.value === value)?.label ?? value;
}

function statusLabel(value: AdminStatusValue) {
  return adminStatuses.find((item) => item.value === value)?.label ?? value;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", { hour12: false });
}

function normalizeOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function buildCreatePayload(values: AdminFormValues): AdminUserCreatePayload {
  return {
    username: values.username.trim(),
    password: values.password?.trim() ?? "",
    displayName: values.displayName.trim(),
    email: normalizeOptional(values.email ?? undefined),
    role: values.role,
    status: values.status
  };
}

function buildUpdatePayload(values: AdminFormValues): AdminUserUpdatePayload {
  const payload: AdminUserUpdatePayload = {
    displayName: values.displayName.trim(),
    email: normalizeOptional(values.email ?? undefined),
    role: values.role,
    status: values.status
  };
  const password = values.password?.trim();
  if (password) {
    payload.password = password;
  }
  return payload;
}

function toFormValues(record?: AdminUserRecord): AdminFormValues {
  if (!record) {
    return {
      username: "",
      displayName: "",
      email: "",
      role: "viewer",
      status: "active",
      password: ""
    };
  }
  return {
    username: record.username,
    displayName: record.displayName,
    email: record.email ?? "",
    role: record.role,
    status: record.status,
    password: ""
  };
}

function AdminFilters({ value, onChange }: { value: AdminFilterState; onChange: (next: AdminFilterState) => void }) {
  return (
    <form
      className="grid grid-cols-1 gap-4 md:grid-cols-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onChange({
          role: ((form.get("role") as AdminFilterState["role"]) ?? "all") as AdminFilterState["role"],
          status: ((form.get("status") as AdminFilterState["status"]) ?? "all") as AdminFilterState["status"],
          search: ((form.get("search") as string) ?? "").trim(),
          page: 1,
          pageSize: value.pageSize
        });
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm text-muted-foreground">角色</label>
        <select name="role" defaultValue={value.role} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="all">全部角色</option>
          {adminRoles.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-muted-foreground">状态</label>
        <select name="status" defaultValue={value.status} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="all">全部状态</option>
          {adminStatuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1 md:col-span-3">
        <label className="text-sm text-muted-foreground">关键词</label>
        <input
          type="text"
          name="search"
          defaultValue={value.search}
          placeholder="按用户名、姓名或邮箱搜索"
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-end justify-end gap-3">
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          应用筛选
        </button>
      </div>
    </form>
  );
}

function AdminForm({
  mode,
  defaultValues,
  submitting,
  onSubmit
}: {
  mode: AdminFormMode;
  defaultValues: AdminFormValues;
  submitting: boolean;
  onSubmit: AdminFormSubmit;
}) {
  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleSubmit = form.handleSubmit((values) => {
    if (mode === "create" && !values.password?.trim()) {
      form.setError("password", { message: "请设置初始密码" });
      return;
    }
    onSubmit(values, {
      setFieldError: (field, message) => form.setError(field, { message })
    });
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">用户名</label>
          <input
            type="text"
            {...form.register("username")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="admin"
            disabled={mode === "edit"}
          />
          {form.formState.errors.username && (
            <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">显示名称</label>
          <input
            type="text"
            {...form.register("displayName")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="运营管理员"
          />
          {form.formState.errors.displayName && (
            <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">邮箱</label>
          <input
            type="email"
            {...form.register("email")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="admin@example.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">角色</label>
          <select {...form.register("role")}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            {adminRoles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">状态</label>
          <select {...form.register("status")}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            {adminStatuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">{mode === "create" ? "初始密码" : "重置密码"}</label>
          <input
            type="password"
            {...form.register("password")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder={mode === "create" ? "至少 8 位，区分大小写" : "留空则不修改密码"}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        >
          {submitting ? "保存中..." : "保存管理员"}
        </button>
      </div>
    </form>
  );
}

export default function AdminsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminFilterState>({ role: "all", status: "all", search: "", page: 1, pageSize: 20 });
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<AdminUserRecord | null>(null);
  const [editTarget, setEditTarget] = useState<AdminUserRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRecord | null>(null);

  const queryParams = useMemo<AdminUserListParams>(() => {
    const params: AdminUserListParams = { page: filters.page, pageSize: filters.pageSize };
    if (filters.role !== "all") params.role = filters.role;
    if (filters.status !== "all") params.status = filters.status;
    if (filters.search) params.search = filters.search;
    return params;
  }, [filters]);

  const adminsQuery = useQuery({
    queryKey: ["admin-users", queryParams],
    queryFn: () => listAdminUsers(queryParams)
  });

  const createMutation = useMutation({
    mutationFn: async (payload: AdminUserCreatePayload) => createAdminUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreateOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: AdminUserUpdatePayload }) => updateAdminUser(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditTarget(null);
      setViewTarget((prev) => (prev && data && prev.id === data.id ? data : prev));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteAdminUser(id),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteTarget(null);
      setViewTarget((prev) => (prev && prev.id === variables ? null : prev));
    }
  });

  const listData = adminsQuery.data?.data ?? [];
  const pagination = adminsQuery.data?.pagination;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;

  const handleCreateSubmit: AdminFormSubmit = (values, helpers) => {
    if (!values.password?.trim()) {
      helpers.setFieldError("password", "请设置初始密码");
      return;
    }
    const payload = buildCreatePayload(values);
    createMutation.mutate(payload);
  };

  const handleUpdateSubmit: AdminFormSubmit = (values, _helpers) => {
    if (!editTarget) return;
    const payload = buildUpdatePayload(values);
    updateMutation.mutate({ id: editTarget.id, payload });
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">管理员权限管理</h2>
            <p className="text-sm text-muted-foreground">维护后台登录账户、分配角色权限并支持密码重置。</p>
          </div>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            onClick={() => setCreateOpen(true)}
          >
            新建管理员
          </button>
        </div>
        <div className="mt-6">
          <AdminFilters value={filters} onChange={setFilters} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        {adminsQuery.isLoading && <p className="text-sm text-muted-foreground">正在加载管理员...</p>}
        {adminsQuery.isError && (
          <p className="text-sm text-destructive">加载失败：{(adminsQuery.error as Error).message}</p>
        )}

        {!adminsQuery.isLoading && listData.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            暂无管理员记录，可调整筛选条件或新建管理员。
          </div>
        )}

        {listData.length > 0 && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">用户名</th>
                    <th className="px-4 py-3">显示名称</th>
                    <th className="px-4 py-3">角色</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">最近登录</th>
                    <th className="px-4 py-3">创建时间</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listData.map((admin) => (
                    <tr key={admin.id} className="text-sm">
                      <td className="px-4 py-2 font-medium text-foreground">{admin.username}</td>
                      <td className="px-4 py-2 text-muted-foreground">{admin.displayName}</td>
                      <td className="px-4 py-2 text-muted-foreground">{roleLabel(admin.role)}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium">
                          {statusLabel(admin.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{formatDateTime(admin.lastLoginAt)}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{formatDateTime(admin.createdAt)}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            className="rounded-md border border-border px-3 py-1 text-muted-foreground hover:bg-muted"
                            onClick={() => setViewTarget(admin)}
                          >
                            查看
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-border px-3 py-1 text-muted-foreground hover:bg-muted"
                            onClick={() => setEditTarget(admin)}
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            className="rounded-md bg-destructive px-3 py-1 text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => setDeleteTarget(admin)}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && (
              <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
                <div>
                  共 {pagination.total} 人 · 第 {pagination.page}/{totalPages} 页
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
                    disabled={filters.page <= 1 || adminsQuery.isFetching}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                    }
                  >
                    上一页
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
                    disabled={pagination.page >= totalPages || adminsQuery.isFetching}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))
                    }
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="新建管理员">
        <AdminForm
          mode="create"
          defaultValues={toFormValues()}
          submitting={createMutation.isPending}
          onSubmit={handleCreateSubmit}
        />
        {createMutation.isError && (
          <p className="mt-4 text-sm text-destructive">{(createMutation.error as Error).message}</p>
        )}
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="编辑管理员">
        {editTarget && (
          <AdminForm
            mode="edit"
            defaultValues={toFormValues(editTarget)}
            submitting={updateMutation.isPending}
            onSubmit={handleUpdateSubmit}
          />
        )}
        {updateMutation.isError && (
          <p className="mt-4 text-sm text-destructive">{(updateMutation.error as Error).message}</p>
        )}
      </Modal>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.displayName ?? "管理员详情"}>
        {viewTarget && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">用户名</p>
                <p>{viewTarget.username}</p>
              </div>
              <div>
                <p className="text-muted-foreground">邮箱</p>
                <p>{viewTarget.email ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">角色</p>
                <p>{roleLabel(viewTarget.role)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">状态</p>
                <p>{statusLabel(viewTarget.status)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">最近登录</p>
                <p>{formatDateTime(viewTarget.lastLoginAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">创建时间</p>
                <p>{formatDateTime(viewTarget.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">更新时间</p>
                <p>{formatDateTime(viewTarget.updatedAt)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除管理员"
        description={`确定要删除 ${deleteTarget?.displayName ?? ""} (${deleteTarget?.username ?? ""}) 吗？该操作无法撤销。`}
        confirmLabel={deleteMutation.isPending ? "删除中..." : "确认删除"}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}


"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { createUser, deleteUser, listUsers, updateUser, type UserRecord, type UserListParams } from "@/lib/api/users";
import type { UserCreatePayload, UserUpdatePayload } from "@/lib/dto/users";

const userRoles = [
  { value: "patient", label: "患者" },
  { value: "caregiver", label: "照护者" },
  { value: "family", label: "家属" },
  { value: "guest", label: "访客" }
] as const;

const userStatuses = [
  { value: "invited", label: "邀请中" },
  { value: "active", label: "活跃" },
  { value: "inactive", label: "停用" },
  { value: "suspended", label: "已封禁" }
] as const;

type UserRoleValue = (typeof userRoles)[number]["value"];
type UserStatusValue = (typeof userStatuses)[number]["value"];

type UserFilterState = {
  role: "all" | UserRoleValue;
  status: "all" | UserStatusValue;
  search: string;
  page: number;
  pageSize: number;
};

const phonePattern = /^[+\d\-()\s]+$/u;

const userFormSchema = z.object({
  email: z.string().trim().email("请输入有效邮箱"),
  fullName: z.string().trim().min(1, "请输入姓名").max(120, "姓名长度不超过 120 个字符"),
  phone: z.string().trim().regex(phonePattern, "手机号格式不正确").optional().or(z.literal("")),
  avatarUrl: z.string().url("请输入有效头像链接").optional().or(z.literal("")),
  role: z.enum(["patient", "caregiver", "family", "guest"] as const),
  status: z.enum(["invited", "active", "inactive", "suspended"] as const),
  password: z.string().min(6, "请设置至少 6 位密码").max(128, "密码过长").optional().or(z.literal(""))
});

type UserFormValues = z.infer<typeof userFormSchema>;

type UserFormSubmit = (
  values: UserFormValues,
  helpers: { setFieldError: (field: keyof UserFormValues, message: string) => void }
) => void;

type UserFormMode = "create" | "edit";

function roleLabel(value: UserRoleValue) {
  return userRoles.find((item) => item.value === value)?.label ?? value;
}

function statusLabel(value: UserStatusValue) {
  return userStatuses.find((item) => item.value === value)?.label ?? value;
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

function buildCreatePayload(values: UserFormValues): UserCreatePayload {
  return {
    email: values.email.trim(),
    fullName: values.fullName.trim(),
    phone: normalizeOptional(values.phone ?? undefined),
    avatarUrl: normalizeOptional(values.avatarUrl ?? undefined),
    role: values.role,
    status: values.status,
    password: values.password?.trim() ?? "",
    metadata: {}
  };
}

function buildUpdatePayload(values: UserFormValues): UserUpdatePayload {
  const payload: UserUpdatePayload = {
    email: values.email.trim(),
    fullName: values.fullName.trim(),
    phone: normalizeOptional(values.phone ?? undefined),
    avatarUrl: normalizeOptional(values.avatarUrl ?? undefined),
    role: values.role,
    status: values.status
  };
  const password = values.password?.trim();
  if (password) payload.password = password;
  return payload;
}

function toFormValues(record?: UserRecord): UserFormValues {
  if (!record) {
    return {
      email: "",
      fullName: "",
      phone: "",
      avatarUrl: "",
      role: "patient",
      status: "invited",
      password: ""
    };
  }
  return {
    email: record.email,
    fullName: record.fullName,
    phone: record.phone ?? "",
    avatarUrl: record.avatarUrl ?? "",
    role: record.role,
    status: record.status,
    password: ""
  };
}

function UsersFilters({ value, onChange }: { value: UserFilterState; onChange: (next: UserFilterState) => void }) {
  return (
    <form
      className="grid grid-cols-1 gap-4 md:grid-cols-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onChange({
          role: ((form.get("role") as UserFilterState["role"]) ?? "all") as UserFilterState["role"],
          status: ((form.get("status") as UserFilterState["status"]) ?? "all") as UserFilterState["status"],
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
          {userRoles.map((item) => (
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
          {userStatuses.map((item) => (
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
          placeholder="按姓名、邮箱或电话搜索"
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

function UserForm({
  mode,
  defaultValues,
  submitting,
  onSubmit
}: {
  mode: UserFormMode;
  defaultValues: UserFormValues;
  submitting: boolean;
  onSubmit: UserFormSubmit;
}) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
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
          <label className="text-sm font-medium text-foreground">邮箱</label>
          <input
            type="email"
            {...form.register("email")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="user@example.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">姓名</label>
          <input
            type="text"
            {...form.register("fullName")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="张三"
          />
          {form.formState.errors.fullName && (
            <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">手机号</label>
          <input
            type="text"
            {...form.register("phone")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="+86 138 0000 0000"
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">头像链接</label>
          <input
            type="url"
            {...form.register("avatarUrl")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="https://..."
          />
          {form.formState.errors.avatarUrl && (
            <p className="text-sm text-destructive">{form.formState.errors.avatarUrl.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">角色</label>
          <select {...form.register("role")} className="rounded-md border border-border px-3 py-2 text-sm">
            {userRoles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">状态</label>
          <select {...form.register("status")} className="rounded-md border border-border px-3 py-2 text-sm">
            {userStatuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-sm font-medium text-foreground">密码{mode === "edit" ? "（可选）" : ""}</label>
          <input
            type="password"
            {...form.register("password")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder={mode === "create" ? "设置初始密码" : "如需重置请输入新密码"}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
          {submitting ? (mode === "create" ? "创建中..." : "保存中...") : mode === "create" ? "创建用户" : "保存更改"}
        </button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserFilterState>({ role: "all", status: "all", search: "", page: 1, pageSize: 20 });
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<UserRecord | null>(null);
  const [editTarget, setEditTarget] = useState<UserRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users", filters],
    queryFn: () =>
      listUsers({
        role: filters.role === "all" ? undefined : (filters.role as UserListParams["role"]),
        status: filters.status === "all" ? undefined : (filters.status as UserListParams["status"]),
        search: filters.search || undefined,
        page: filters.page,
        pageSize: filters.pageSize
      })
  });

  const listData = usersQuery.data?.data ?? [];
  const pagination = usersQuery.data?.pagination;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;

  const createMutation = useMutation({
    mutationFn: (input: UserFormValues) => createUser(buildCreatePayload(input)),
    onSuccess: () => {
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserFormValues }) => updateUser(id, buildUpdatePayload(values)),
    onSuccess: () => {
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  const handleCreateSubmit: UserFormSubmit = (values, { setFieldError }) => {
    createMutation.mutate(values, {
      onError: (err: any) => setFieldError("email", err?.message ?? "创建失败")
    });
  };

  const handleUpdateSubmit: UserFormSubmit = (values, { setFieldError }) => {
    if (!editTarget) return;
    updateMutation.mutate(
      { id: editTarget.id, values },
      { onError: (err: any) => setFieldError("email", err?.message ?? "保存失败") }
    );
  };

  const paginationControls = useMemo(() => {
    if (!pagination) return null;
    return (
      <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
        <div>
          共 {pagination.total} 条 · 第 {pagination.page}/{totalPages} 页
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
            disabled={filters.page <= 1 || usersQuery.isFetching}
            onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          >
            上一页
          </button>
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
            disabled={pagination.page >= totalPages || usersQuery.isFetching}
            onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
          >
            下一页
          </button>
        </div>
      </div>
    );
  }, [filters.page, pagination, totalPages, usersQuery.isFetching]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">用户管理</h2>
            <p className="text-sm text-muted-foreground">查看与维护平台用户账号与状态。</p>
          </div>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            onClick={() => setCreateOpen(true)}
          >
            新建用户
          </button>
        </div>
        <div className="mt-6">
          <UsersFilters value={filters} onChange={setFilters} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        {usersQuery.isLoading && <p className="text-sm text-muted-foreground">正在加载用户...</p>}
        {usersQuery.isError && (
          <p className="text-sm text-destructive">加载失败：{(usersQuery.error as Error).message}</p>
        )}

        {!usersQuery.isLoading && listData.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            暂无用户记录。可以调整筛选条件，或创建新用户。
          </div>
        )}

        {listData.length > 0 && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">邮箱</th>
                    <th className="px-4 py-3">姓名</th>
                    <th className="px-4 py-3">角色</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">最后登录</th>
                    <th className="px-4 py-3">创建时间</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listData.map((user) => (
                    <tr key={user.id} className="text-sm">
                      <td className="px-4 py-2 font-medium text-foreground">{user.email}</td>
                      <td className="px-4 py-2 text-muted-foreground">{user.fullName}</td>
                      <td className="px-4 py-2 text-muted-foreground">{roleLabel(user.role)}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium">
                          {statusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{formatDateTime(user.lastLoginAt)}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{formatDateTime(user.createdAt)}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            className="rounded-md border border-border px-3 py-1 text-muted-foreground hover:bg-muted"
                            onClick={() => setViewTarget(user)}
                          >
                            查看
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-border px-3 py-1 text-muted-foreground hover:bg-muted"
                            onClick={() => setEditTarget(user)}
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            className="rounded-md bg-destructive px-3 py-1 text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => setDeleteTarget(user)}
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
            {pagination && paginationControls}
          </div>
        )}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="新建用户">
        <UserForm mode="create" defaultValues={toFormValues()} submitting={createMutation.isPending} onSubmit={handleCreateSubmit} />
        {createMutation.isError && (
          <p className="mt-4 text-sm text-destructive">{(createMutation.error as Error).message}</p>
        )}
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="编辑用户">
        {editTarget && (
          <UserForm
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

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.fullName ?? "用户详情"}>
        {viewTarget && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">邮箱</p>
                <p>{viewTarget.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">电话</p>
                <p>{viewTarget.phone ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">姓名</p>
                <p>{viewTarget.fullName}</p>
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
                <p className="text-muted-foreground">最后登录</p>
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
        title="删除用户"
        description={`确认要删除 ${deleteTarget?.fullName ?? ""} (${deleteTarget?.email ?? ""}) 吗？该操作不可恢复。`}
        confirmLabel={deleteMutation.isPending ? "删除中..." : "确认删除"}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

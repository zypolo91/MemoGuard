"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { createTask, deleteTask, listTasks, updateTask } from "@/lib/api/tasks";
import type { TaskRecord } from "@/lib/api/tasks";
import type { TaskPayload, TaskUpdatePayload } from "@/lib/dto/tasks";

type TaskFilterState = {
  priority: "all" | "low" | "medium" | "high";
  search: string;
};

const priorityLabels: Record<TaskFilterState["priority"], string> = {
  all: "全部优先级",
  low: "低优先级",
  medium: "中优先级",
  high: "高优先级"
};

const taskFormSchema = z.object({
  title: z.string().min(1, "请输入任务标题").max(160, "标题长度不应超过 160 个字符"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  frequency: z.string().optional(),
  dueAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u, "请输入有效的截止时间")
    .optional()
    .or(z.literal(""))
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

function buildPayload(values: TaskFormValues): TaskPayload {
  return {
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    priority: values.priority,
    frequency: values.frequency?.trim() || undefined,
    dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : undefined
  };
}

function buildUpdatePayload(values: TaskFormValues): TaskUpdatePayload {
  return buildPayload(values);
}

function toFormValues(task?: TaskRecord): TaskFormValues {
  if (!task) {
    return {
      title: "",
      description: "",
      priority: "medium",
      frequency: "",
      dueAt: ""
    };
  }

  return {
    title: task.title ?? "",
    description: task.description ?? "",
    priority: task.priority,
    frequency: task.frequency ?? "",
    dueAt: toInputDateTime(task.dueAt)
  };
}

function toReadableDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", { hour12: false });
}

function toInputDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function latestStatus(task: TaskRecord) {
  if (!task.history.length) return "-";
  const sorted = [...task.history].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  return sorted[0]?.status ?? "-";
}

function Filters({ value, onChange }: { value: TaskFilterState; onChange: (next: TaskFilterState) => void }) {
  return (
    <form
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onChange({
          priority: ((form.get("priority") as TaskFilterState["priority"]) ?? "all") as TaskFilterState["priority"],
          search: ((form.get("search") as string) ?? "").trim()
        });
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm text-muted-foreground">优先级</label>
        <select name="priority" defaultValue={value.priority} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="all">全部优先级</option>
          <option value="high">高优先级</option>
          <option value="medium">中优先级</option>
          <option value="low">低优先级</option>
        </select>
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label className="text-sm text-muted-foreground">关键词</label>
        <input
          type="text"
          name="search"
          defaultValue={value.search}
          placeholder="按名称或描述搜索"
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-end justify-end gap-3 md:col-span-3">
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

function TaskForm({
  defaultValues,
  submitting,
  onSubmit
}: {
  defaultValues: TaskFormValues;
  submitting: boolean;
  onSubmit: (values: TaskFormValues) => void;
}) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleSubmit = form.handleSubmit((values) => onSubmit(values));

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">任务标题</label>
          <input
            type="text"
            {...form.register("title")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="输入任务名称"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">优先级</label>
          <select
            {...form.register("priority")}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">执行频率</label>
          <input
            type="text"
            {...form.register("frequency")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="例如：每日一次"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">截止时间</label>
          <input
            type="datetime-local"
            {...form.register("dueAt")}
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
          {form.formState.errors.dueAt && (
            <p className="text-sm text-destructive">{form.formState.errors.dueAt.message}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">任务描述</label>
        <textarea
          rows={4}
          {...form.register("description")}
          className="rounded-md border border-border px-3 py-2 text-sm"
          placeholder="补充任务细节、注意事项等"
        />
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        >
          {submitting ? "保存中..." : "保存任务"}
        </button>
      </div>
    </form>
  );
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TaskFilterState>({ priority: "all", search: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<TaskRecord | null>(null);
  const [editTarget, setEditTarget] = useState<TaskRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskRecord | null>(null);

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: () => listTasks()
  });

  const filteredTasks = useMemo(() => {
    const data = tasksQuery.data ?? [];
    return data.filter((task) => {
      const priorityOk = filters.priority === "all" || task.priority === filters.priority;
      const searchOk = filters.search
        ? `${task.title ?? ""} ${task.description ?? ""}`.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      return priorityOk && searchOk;
    });
  }, [tasksQuery.data, filters]);

  const createMutation = useMutation({
    mutationFn: async (values: TaskFormValues) => createTask(buildPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setCreateOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TaskFormValues }) => updateTask(id, buildUpdatePayload(values)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setEditTarget(null);
      setViewTarget((prev) => (prev && data && prev.id === data.id ? data : prev));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteTask(id),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDeleteTarget(null);
      setViewTarget((prev) => (prev && prev.id === variables ? null : prev));
    }
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">任务列表</h2>
            <p className="text-sm text-muted-foreground">集中管理记忆提醒、日常护理和随访任务</p>
          </div>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            onClick={() => setCreateOpen(true)}
          >
            新建任务
          </button>
        </div>
        <div className="mt-6">
          <Filters value={filters} onChange={setFilters} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        {tasksQuery.isLoading && <p className="text-sm text-muted-foreground">正在加载任务...</p>}
        {tasksQuery.isError && (
          <p className="text-sm text-destructive">加载失败：{(tasksQuery.error as Error).message}</p>
        )}

        {!tasksQuery.isLoading && filteredTasks.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            暂无匹配的任务，可调整筛选条件或新建任务。
          </div>
        )}

        {filteredTasks.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">任务</th>
                  <th className="px-4 py-3">描述</th>
                  <th className="px-4 py-3">优先级</th>
                  <th className="px-4 py-3">截止时间</th>
                  <th className="px-4 py-3">最近状态</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="text-sm">
                    <td className="px-4 py-2 font-medium text-foreground">{task.title}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {task.description ? task.description.slice(0, 120) : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium">
                        {priorityLabels[task.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{toReadableDateTime(task.dueAt)}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{latestStatus(task)}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          className="rounded-md border border-border px-3 py-1 text-muted-foreground hover:bg-muted"
                          onClick={() => setViewTarget(task)}
                        >
                          查看
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-border px-3 py-1 text-muted-foreground hover:bg-muted"
                          onClick={() => setEditTarget(task)}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-destructive px-3 py-1 text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => setDeleteTarget(task)}
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
        )}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="新建任务">
        <TaskForm
          defaultValues={toFormValues()}
          submitting={createMutation.isPending}
          onSubmit={(values) => createMutation.mutate(values)}
        />
        {createMutation.isError && (
          <p className="mt-4 text-sm text-destructive">{(createMutation.error as Error).message}</p>
        )}
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="编辑任务">
        {editTarget && (
          <TaskForm
            defaultValues={toFormValues(editTarget)}
            submitting={updateMutation.isPending}
            onSubmit={(values) => updateMutation.mutate({ id: editTarget.id, values })}
          />
        )}
        {updateMutation.isError && (
          <p className="mt-4 text-sm text-destructive">{(updateMutation.error as Error).message}</p>
        )}
      </Modal>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.title ?? "任务详情"}>
        {viewTarget && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">优先级</p>
                <p>{priorityLabels[viewTarget.priority]}</p>
              </div>
              <div>
                <p className="text-muted-foreground">截止时间</p>
                <p>{toReadableDateTime(viewTarget.dueAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">创建时间</p>
                <p>{toReadableDateTime(viewTarget.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">更新时间</p>
                <p>{toReadableDateTime(viewTarget.updatedAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">任务描述</p>
              <p className="whitespace-pre-wrap text-foreground">{viewTarget.description ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">执行频率</p>
              <p>{viewTarget.frequency ?? "-"}</p>
            </div>
            {viewTarget.reminders.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground">提醒记录</p>
                <div className="space-y-2">
                  {viewTarget.reminders.map((reminder) => (
                    <div key={reminder.id} className="rounded-md border border-border p-3 text-xs text-muted-foreground">
                      <p className="text-foreground">{reminder.status}</p>
                      <p>{toReadableDateTime(reminder.timestamp)}</p>
                      {reminder.notes && <p>{reminder.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {viewTarget.history.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground">状态历史</p>
                <div className="space-y-2">
                  {[...viewTarget.history]
                    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
                    .map((entry) => (
                      <div key={entry.id} className="rounded-md border border-border p-3 text-xs text-muted-foreground">
                        <p className="text-foreground">{entry.status}</p>
                        <p>{toReadableDateTime(entry.changedAt)}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除任务"
        description={`确定要删除 ${deleteTarget?.title ?? ""} 吗？该操作无法撤销。`}
        confirmLabel={deleteMutation.isPending ? "删除中..." : "确认删除"}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}


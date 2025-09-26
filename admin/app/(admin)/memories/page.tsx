"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { createMemory, deleteMemory, listMemories, updateMemory } from "@/lib/api/memories";
import type { MemoryRecord } from "@/lib/api/memories";
import type { MemoryPayload, MemoryUpdatePayload } from "@/lib/dto/memories";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/u;

type MemoryFilterState = {
  tag: string;
  from: string;
  to: string;
  search: string;
};

const memoryFormSchema = z.object({
  title: z.string().min(1, "请输入记忆标题").max(120, "标题长度不应超过 120 个字符"),
  content: z.string().min(1, "请输入记忆内容"),
  richText: z.string().optional(),
  eventDate: z.string().regex(dateRegex, "日期格式需为 YYYY-MM-DD"),
  mood: z.string().optional(),
  location: z.string().optional(),
  tags: z.string().optional(),
  people: z.string().optional()
});

type MemoryFormValues = z.infer<typeof memoryFormSchema>;

type MemoryMutationInput = MemoryFormValues;

type UpdateMutationInput = { id: string; values: MemoryFormValues };

function splitToList(value?: string | null) {
  if (!value) return [];
  return value
    .split(/[,，\s]+/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(values?: string[] | null) {
  if (!values || values.length === 0) return "";
  return values.join("，");
}

function buildPayload(values: MemoryFormValues): MemoryPayload {
  return {
    title: values.title.trim(),
    content: values.content.trim(),
    richText: values.richText?.trim() || undefined,
    eventDate: values.eventDate,
    mood: values.mood?.trim() || undefined,
    location: values.location?.trim() || undefined,
    tags: splitToList(values.tags),
    people: splitToList(values.people),
    media: []
  };
}

function buildUpdatePayload(values: MemoryFormValues): MemoryUpdatePayload {
  const payload = buildPayload(values);
  const { media, ...rest } = payload;
  const result: MemoryUpdatePayload = { ...rest };
  return result;
}

function toFormValues(memory?: MemoryRecord): MemoryFormValues {
  if (!memory) {
    return {
      title: "",
      content: "",
      richText: "",
      eventDate: new Date().toISOString().slice(0, 10),
      mood: "",
      location: "",
      tags: "",
      people: ""
    };
  }

  return {
    title: memory.title ?? "",
    content: memory.content ?? "",
    richText: memory.richText ?? "",
    eventDate: memory.eventDate.slice(0, 10),
    mood: memory.mood ?? "",
    location: memory.location ?? "",
    tags: joinList(memory.tags),
    people: joinList(memory.people)
  };
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function MemoryFilters({ value, onChange }: { value: MemoryFilterState; onChange: (next: MemoryFilterState) => void }) {
  return (
    <form
      className="grid grid-cols-1 gap-4 md:grid-cols-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onChange({
          tag: ((form.get("tag") as string) ?? "").trim(),
          from: (form.get("from") as string) ?? "",
          to: (form.get("to") as string) ?? "",
          search: ((form.get("search") as string) ?? "").trim()
        });
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm text-muted-foreground">标签</label>
        <input
          type="text"
          name="tag"
          defaultValue={value.tag}
          placeholder="按标签过滤"
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-muted-foreground">开始日期</label>
        <input type="date" name="from" defaultValue={value.from} className="rounded-md border border-border px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-muted-foreground">结束日期</label>
        <input type="date" name="to" defaultValue={value.to} className="rounded-md border border-border px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label className="text-sm text-muted-foreground">关键词</label>
        <input
          type="text"
          name="search"
          defaultValue={value.search}
          placeholder="搜索标题、地点或内容"
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-end justify-end gap-3 md:col-span-5">
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

function MemoryForm({
  defaultValues,
  submitting,
  onSubmit
}: {
  defaultValues: MemoryFormValues;
  submitting: boolean;
  onSubmit: (values: MemoryFormValues) => void;
}) {
  const form = useForm<MemoryFormValues>({
    resolver: zodResolver(memoryFormSchema),
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
          <label className="text-sm font-medium text-foreground">记忆标题</label>
          <input
            type="text"
            {...form.register("title")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="例如：家庭聚会的欢乐时光"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">发生日期</label>
          <input
            type="date"
            {...form.register("eventDate")}
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
          {form.formState.errors.eventDate && (
            <p className="text-sm text-destructive">{form.formState.errors.eventDate.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">情绪 / 心情</label>
          <input
            type="text"
            {...form.register("mood")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="例如：温馨、感动"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">地点</label>
          <input
            type="text"
            {...form.register("location")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="例如：上海市徐汇区"
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-sm font-medium text-foreground">标签</label>
          <input
            type="text"
            {...form.register("tags")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="使用逗号分隔，例如：家庭，生日"
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-sm font-medium text-foreground">参与人物</label>
          <input
            type="text"
            {...form.register("people")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="使用逗号分隔，例如：妈妈，外孙"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">记忆内容</label>
        <textarea
          rows={5}
          {...form.register("content")}
          className="rounded-md border border-border px-3 py-2 text-sm"
          placeholder="记录发生的细节、对话或感受"
        />
        {form.formState.errors.content && (
          <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">富文本（可选）</label>
        <textarea
          rows={4}
          {...form.register("richText")}
          className="rounded-md border border-border px-3 py-2 text-sm"
          placeholder="可以粘贴从前端编辑器生成的富文本 JSON"
        />
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        >
          {submitting ? "保存中..." : "保存记忆"}
        </button>
      </div>
    </form>
  );
}

export default function MemoriesPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<MemoryFilterState>({ tag: "", from: "", to: "", search: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<MemoryRecord | null>(null);
  const [editTarget, setEditTarget] = useState<MemoryRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemoryRecord | null>(null);

  const queryParams = useMemo(() => {
    return {
      ...(filters.tag ? { tag: filters.tag } : {}),
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {})
    };
  }, [filters.tag, filters.from, filters.to]);

  const memoriesQuery = useQuery({
    queryKey: ["memories", queryParams],
    queryFn: () => listMemories(queryParams)
  });

  const filteredMemories = useMemo(() => {
    const data = memoriesQuery.data ?? [];
    if (!filters.search) return data;
    const keyword = filters.search.toLowerCase();
    return data.filter((memory) => {
      const text = [memory.title, memory.location, memory.content, memory.richText]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(keyword);
    });
  }, [memoriesQuery.data, filters.search]);

  const createMutation = useMutation({
    mutationFn: async (values: MemoryMutationInput) => createMemory(buildPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      setCreateOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: UpdateMutationInput) => updateMemory(id, buildUpdatePayload(values)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      setEditTarget(null);
      setViewTarget((prev) => (prev && data && prev.id === data.id ? data : prev));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteMemory(id),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      setDeleteTarget(null);
      setViewTarget((prev) => (prev && prev.id === variables ? null : prev));
    }
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">记忆库</h2>
            <p className="text-sm text-muted-foreground">集中管理记忆、影像资料与洞察，支撑患者个性化照护。</p>
          </div>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            onClick={() => setCreateOpen(true)}
          >
            新建记忆
          </button>
        </div>
        <div className="mt-6">
          <MemoryFilters value={filters} onChange={setFilters} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        {memoriesQuery.isLoading && <p className="text-sm text-muted-foreground">正在加载记忆...</p>}
        {memoriesQuery.isError && (
          <p className="text-sm text-destructive">加载失败：{(memoriesQuery.error as Error).message}</p>
        )}

        {!memoriesQuery.isLoading && filteredMemories.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            暂无符合条件的记忆，可调整筛选条件或创建新记录。
          </div>
        )}

        {filteredMemories.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">标题</th>
                  <th className="px-4 py-3">日期</th>
                  <th className="px-4 py-3">地点</th>
                  <th className="px-4 py-3">情绪</th>
                  <th className="px-4 py-3">标签</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMemories.map((memory) => (
                  <tr key={memory.id} className="text-sm">
                    <td className="px-4 py-2 font-medium text-foreground">{memory.title}</td>
                    <td className="px-4 py-2 text-muted-foreground">{formatDate(memory.eventDate)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{memory.location || "-"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{memory.mood || "-"}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {memory.tags.length > 0 ? memory.tags.join("、") : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          className="rounded-md border border-border px-3 py-1 text-muted-foreground hover:bg-muted"
                          onClick={() => setViewTarget(memory)}
                        >
                          查看
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-border px-3 py-1 text-muted-foreground hover:bg-muted"
                          onClick={() => setEditTarget(memory)}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-destructive px-3 py-1 text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => setDeleteTarget(memory)}
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="新建记忆">
        <MemoryForm
          defaultValues={toFormValues()}
          submitting={createMutation.isPending}
          onSubmit={(values) => createMutation.mutate(values)}
        />
        {createMutation.isError && (
          <p className="mt-4 text-sm text-destructive">{(createMutation.error as Error).message}</p>
        )}
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="编辑记忆">
        {editTarget && (
          <MemoryForm
            defaultValues={toFormValues(editTarget)}
            submitting={updateMutation.isPending}
            onSubmit={(values) => updateMutation.mutate({ id: editTarget.id, values })}
          />
        )}
        {updateMutation.isError && (
          <p className="mt-4 text-sm text-destructive">{(updateMutation.error as Error).message}</p>
        )}
      </Modal>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.title ?? "记忆详情"}>
        {viewTarget && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">记忆日期</p>
                <p>{formatDate(viewTarget.eventDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">创建时间</p>
                <p>{formatDateTime(viewTarget.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">更新时间</p>
                <p>{formatDateTime(viewTarget.updatedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">地点</p>
                <p>{viewTarget.location || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">心情</p>
                <p>{viewTarget.mood || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">参与人物</p>
                <p>{viewTarget.people.length > 0 ? viewTarget.people.join("、") : "-"}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">标签</p>
              <p>{viewTarget.tags.length > 0 ? viewTarget.tags.join("、") : "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">记忆内容</p>
              <p className="whitespace-pre-wrap text-foreground">{viewTarget.content}</p>
            </div>
            {viewTarget.richText && (
              <div>
                <p className="text-muted-foreground">富文本</p>
                <pre className="whitespace-pre-wrap rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{viewTarget.richText}</pre>
              </div>
            )}
            {viewTarget.media.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground">关联媒体</p>
                <div className="space-y-2">
                  {viewTarget.media.map((item) => (
                    <div key={item.id} className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                      <p className="text-foreground">{item.type}</p>
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-primary underline">
                        查看资源
                      </a>
                      {item.thumbnailUrl && (
                        <p>
                          缩略图：
                          <a href={item.thumbnailUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                            打开
                          </a>
                        </p>
                      )}
                      {item.altText && <p>描述：{item.altText}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {viewTarget.insights.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground">AI 洞察</p>
                <div className="space-y-2">
                  {viewTarget.insights.map((insight) => (
                    <div key={insight.id} className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                      <p className="text-foreground">{insight.summary}</p>
                      {insight.highlights.length > 0 && (
                        <ul className="list-disc space-y-1 pl-4">
                          {insight.highlights.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      )}
                      <p>{formatDateTime(insight.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {viewTarget.annotations.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground">标注记录</p>
                <div className="space-y-2">
                  {viewTarget.annotations.map((annotation) => (
                    <div key={annotation.id} className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                      <p className="text-foreground">{annotation.type}</p>
                      <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(annotation.payload, null, 2)}</pre>
                      <p>{formatDateTime(annotation.createdAt)}</p>
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
        title="删除记忆"
        description={`确定要删除《${deleteTarget?.title ?? ""}》吗？该操作无法撤销。`}
        confirmLabel={deleteMutation.isPending ? "删除中..." : "确认删除"}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}


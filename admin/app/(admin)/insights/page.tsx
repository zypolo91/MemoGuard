"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { createArticle, listArticles, updateArticle, updateBookmark, deleteArticle } from "@/lib/api/insights";
import type { InsightArticleRecord } from "@/lib/api/insights";

interface FilterState {
  topic: string;
  bookmark: "all" | "bookmarked" | "unbookmarked";
}

function toRequestParams(filters: FilterState) {
  return {
    topic: filters.topic ? filters.topic.trim() : undefined,
    bookmark: filters.bookmark === "all" ? undefined : filters.bookmark === "bookmarked" ? true : false
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

interface EditorState {
  mode: "create" | "edit";
  data: Partial<InsightArticleRecord> | null;
}

export default function InsightsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterState>({ topic: "", bookmark: "all" });
  const [preview, setPreview] = useState<InsightArticleRecord | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = useMemo(() => toRequestParams(filters), [filters]);

  const articlesQuery = useQuery({
    queryKey: ["insights", params],
    queryFn: () => listArticles(params)
  });

  const bookmarkMutation = useMutation({
    mutationFn: ({ id, isBookmarked }: { id: string; isBookmarked: boolean }) => updateBookmark(id, { isBookmarked }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["insights"] })
  });

  const createMutation = useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      setEditor(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateArticle(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      setEditor(null);
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => deleteArticle(id),
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    }
  });

  const articles = articlesQuery.data ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">资讯速递</h2>
            <p className="text-sm text-muted-foreground">可筛选、收藏，并支持新增/编辑/删除。</p>
          </div>
          <button
            type="button"
            onClick={() => setEditor({ mode: "create", data: {} })}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            新增文章
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <form
          className="grid grid-cols-1 gap-4 md:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setFilters({
              topic: ((form.get("topic") as string) ?? "").trim(),
              bookmark: (form.get("bookmark") as FilterState["bookmark"]) ?? "all"
            });
          }}
        >
          <div className="flex flex-col gap-1 md:col-span-4">
            <label className="text-sm text-muted-foreground">主题</label>
            <input
              type="text"
              name="topic"
              defaultValue={filters.topic}
              placeholder="如：记忆训练、康复建议"
              className="rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">收藏</label>
            <select name="bookmark" defaultValue={filters.bookmark} className="rounded-md border border-border px-3 py-2 text-sm">
              <option value="all">全部</option>
              <option value="bookmarked">已收藏</option>
              <option value="unbookmarked">未收藏</option>
            </select>
          </div>
          <div className="flex items-end justify-end">
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
              应用筛选
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        {articlesQuery.isLoading && <p className="text-sm text-muted-foreground">加载中...</p>}
        {articlesQuery.isError && <p className="text-sm text-destructive">{(articlesQuery.error as Error).message}</p>}
        {!articlesQuery.isLoading && articles.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">暂无数据</div>
        )}
        {articles.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <article key={article.id} className="flex h-full flex-col justify-between rounded-md border border-border p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-foreground line-clamp-2">{article.title}</h3>
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        article.isBookmarked ? "border-primary text-primary" : "border-border text-muted-foreground"
                      }`}
                      onClick={() => bookmarkMutation.mutate({ id: article.id, isBookmarked: !article.isBookmarked })}
                      disabled={bookmarkMutation.isPending}
                    >
                      {article.isBookmarked ? "已收藏" : "收藏"}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{article.source ?? "未知来源"} · {formatDate(article.publishedAt)}</p>
                  {article.summary && <p className="text-sm text-muted-foreground line-clamp-4">{article.summary}</p>}
                  {article.topic && (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">#{article.topic}</span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>创建于 {formatDateTime(article.createdAt)}</span>
                  <div className="flex gap-2">
                    {article.contentUrl && (
                      <a href={article.contentUrl} target="_blank" rel="noreferrer" className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted">
                        查看原文
                      </a>
                    )}
                    <button
                      type="button"
                      className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
                      onClick={() => setPreview(article)}
                    >
                      预览
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
                      onClick={() => setEditor({ mode: "edit", data: article })}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(article.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 预览弹窗 */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title ?? "文章"}>
        {preview && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-col gap-1 text-muted-foreground">
              <span>来源：{preview.source ?? "未知"}</span>
              <span>发布时间：{formatDate(preview.publishedAt)}</span>
              <span>主题：{preview.topic ?? "未填写"}</span>
              <span>收藏：{preview.isBookmarked ? "已收藏" : "未收藏"}</span>
            </div>
            {preview.summary && (
              <div>
                <h4 className="text-sm font-medium text-foreground">摘要</h4>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{preview.summary}</p>
              </div>
            )}
            {preview.contentUrl && (
              <a href={preview.contentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-primary underline">
                打开原文
              </a>
            )}
          </div>
        )}
      </Modal>

      {/* 新增/编辑弹窗 */}
      <Modal open={!!editor} onClose={() => setEditor(null)} title={editor?.mode === "create" ? "新增文章" : "编辑文章"}>
        {editor && (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const payload = {
                title: String(fd.get("title") || "").trim(),
                source: String(fd.get("source") || "").trim(),
                contentUrl: String(fd.get("contentUrl") || "").trim(),
                topic: String(fd.get("topic") || "").trim(),
                summary: String(fd.get("summary") || "").trim(),
                publishedAt: String(fd.get("publishedAt") || "").trim()
              };
              if (editor.mode === "create") {
                createMutation.mutate(payload as any);
              } else if (editor.data?.id) {
                updateMutation.mutate({ id: editor.data.id, payload });
              }
            }}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">标题</label>
                <input name="title" required defaultValue={editor.data?.title || ""} className="rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">来源</label>
                <input name="source" defaultValue={editor.data?.source || ""} className="rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs text-muted-foreground">原文链接</label>
                <input name="contentUrl" defaultValue={editor.data?.contentUrl || ""} className="rounded-md border border-border px-3 py-2 text-sm" placeholder="https://..." />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">主题</label>
                <input name="topic" defaultValue={editor.data?.topic || ""} className="rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">发布时间</label>
                <input name="publishedAt" type="datetime-local" defaultValue={editor.data?.publishedAt ? new Date(editor.data.publishedAt).toISOString().slice(0, 16) : ""} className="rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs text-muted-foreground">摘要</label>
                <textarea name="summary" rows={4} defaultValue={editor.data?.summary || ""} className="rounded-md border border-border px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditor(null)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                取消
              </button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-70">
                {editor.mode === "create" ? (createMutation.isPending ? "保存中..." : "保存") : updateMutation.isPending ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="删除文章"
        description={`确定要删除该文章吗？该操作无法撤销。`}
        confirmLabel={removeMutation.isPending ? "删除中..." : "确认删除"}
        cancelLabel="取消"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && removeMutation.mutate(deleteId)}
      />
    </div>
  );
}
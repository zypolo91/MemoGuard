"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { listArticles, updateBookmark } from "@/lib/api/insights";
import type { InsightArticleRecord } from "@/lib/api/insights";

interface FilterState {
  topic: string;
  bookmark: "all" | "bookmarked" | "unbookmarked";
}

function toRequestParams(filters: FilterState) {
  return {
    topic: filters.topic ? filters.topic.trim() : undefined,
    bookmark:
      filters.bookmark === "all"
        ? undefined
        : filters.bookmark === "bookmarked"
          ? true
          : false
  };
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

export default function InsightsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterState>({ topic: "", bookmark: "all" });
  const [selected, setSelected] = useState<InsightArticleRecord | null>(null);

  const params = useMemo(() => toRequestParams(filters), [filters]);

  const articlesQuery = useQuery({
    queryKey: ["insights", params],
    queryFn: () => listArticles(params)
  });

  const bookmarkMutation = useMutation({
    mutationFn: ({ id, isBookmarked }: { id: string; isBookmarked: boolean }) =>
      updateBookmark(id, { isBookmarked }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["insights"] })
  });

  const articles = articlesQuery.data ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">资讯速递</h2>
          <p className="text-sm text-muted-foreground">
            汇总行业新闻与精选内容，可按主题筛选并快速标记收藏，供后续推送与策划参考。
          </p>
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
            <label className="text-sm text-muted-foreground">主题关键词</label>
            <input
              type="text"
              name="topic"
              defaultValue={filters.topic}
              placeholder="例如：记忆训练、照护政策"
              className="rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">收藏状态</label>
            <select name="bookmark" defaultValue={filters.bookmark} className="rounded-md border border-border px-3 py-2 text-sm">
              <option value="all">全部</option>
              <option value="bookmarked">仅收藏</option>
              <option value="unbookmarked">未收藏</option>
            </select>
          </div>
          <div className="flex items-end justify-end">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              应用筛选
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        {articlesQuery.isLoading && <p className="text-sm text-muted-foreground">正在加载资讯...</p>}
        {articlesQuery.isError && (
          <p className="text-sm text-destructive">加载失败：{(articlesQuery.error as Error).message}</p>
        )}
        {!articlesQuery.isLoading && articles.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            暂无符合条件的资讯，可调整筛选条件。
          </div>
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
                  <p className="text-xs text-muted-foreground">
                    {article.source ?? "未知来源"} · {formatDate(article.publishedAt)}
                  </p>
                  {article.summary && <p className="text-sm text-muted-foreground line-clamp-4">{article.summary}</p>}
                  {article.topic && (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                      #{article.topic}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>创建于 {formatDateTime(article.createdAt)}</span>
                  <div className="flex gap-2">
                    {article.contentUrl && (
                      <a
                        href={article.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
                      >
                        打开原文
                      </a>
                    )}
                    <button
                      type="button"
                      className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
                      onClick={() => setSelected(article)}
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? "资讯详情"}>
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-col gap-1 text-muted-foreground">
              <span>来源：{selected.source ?? "未知"}</span>
              <span>发布日期：{formatDate(selected.publishedAt)}</span>
              <span>主题：{selected.topic ?? "未分类"}</span>
              <span>收藏状态：{selected.isBookmarked ? "已收藏" : "未收藏"}</span>
            </div>
            {selected.summary && (
              <div>
                <h4 className="text-sm font-medium text-foreground">摘要</h4>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{selected.summary}</p>
              </div>
            )}
            {selected.contentUrl && (
              <a
                href={selected.contentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm text-primary underline"
              >
                前往原文
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}








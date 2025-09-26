import { apiFetch } from "./client";
import type { BookmarkPayload, ArticleCreatePayload, ArticleUpdatePayload } from "@/lib/dto/insights";

export interface InsightArticleRecord {
  id: string;
  title: string;
  source?: string | null;
  summary?: string | null;
  topic?: string | null;
  contentUrl?: string | null;
  isBookmarked: boolean;
  publishedAt?: string | null;
  createdAt: string;
}

export interface NewsQueryParams {
  topic?: string;
  bookmark?: boolean;
}

function toSearchParams(params: NewsQueryParams = {}) {
  const search = new URLSearchParams();
  if (params.topic) search.set("topic", params.topic);
  if (params.bookmark !== undefined) search.set("bookmark", String(params.bookmark));
  return search;
}

export async function listArticles(params: NewsQueryParams = {}) {
  const search = toSearchParams(params);
  const query = search.toString();
  return apiFetch<InsightArticleRecord[]>(`/api/news${query ? `?${query}` : ""}`);
}

export async function createArticle(payload: ArticleCreatePayload) {
  return apiFetch<InsightArticleRecord>(`/api/news`, {
    method: "POST",
    json: payload
  });
}

export async function updateArticle(id: string, payload: ArticleUpdatePayload) {
  return apiFetch<InsightArticleRecord>(`/api/news/${id}`, {
    method: "PATCH",
    json: payload
  });
}

export async function updateBookmark(id: string, payload: BookmarkPayload) {
  return apiFetch<InsightArticleRecord>(`/api/news/${id}/bookmark`, {
    method: "POST",
    json: payload
  });
}

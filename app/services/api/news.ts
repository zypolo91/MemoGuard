import { apiFetch } from "./client";

export interface RemoteInsightArticle {
  id: string;
  title: string;
  source?: string | null;
  summary?: string | null;
  topic?: string | null;
  contentUrl?: string | null;
  isBookmarked: boolean;
  publishedAt?: string | null;
}

export async function fetchNews(params?: { topic?: string; bookmark?: boolean }) {
  const search = new URLSearchParams();
  if (params?.topic) search.set("topic", params.topic);
  if (params?.bookmark !== undefined) search.set("bookmark", String(params.bookmark));
  const query = search.toString();
  return apiFetch<RemoteInsightArticle[]>(`/news${query ? `?${query}` : ""}`, { method: "GET" });
}

export async function setBookmark(id: string, isBookmarked: boolean) {
  return apiFetch<RemoteInsightArticle>(`/news/${id}/bookmark`, {
    method: "POST",
    json: { isBookmarked }
  });
}

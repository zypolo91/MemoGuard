import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";

import { fetchNews as fetchNewsApi, setBookmark } from "@/services/api/news";
import { loadState, saveState } from "@/utils/storage";

export interface InsightArticle {
  id: string;
  title: string;
  source: string;
  summary: string;
  publishedAt: string;
  topics: string[];
  url: string;
  highlight?: string;
  isBookmarked: boolean;
}

const STORAGE_KEY = "news";

function normalizeArticle(raw: any): InsightArticle {
  return {
    id: String(raw.id ?? `news-${Math.random().toString(36).slice(2, 10)}`),
    title: String(raw.title ?? "未命名文章"),
    source: String(raw.source ?? "未知来源"),
    summary: String(raw.summary ?? "暂无摘要"),
    publishedAt: String(raw.publishedAt ?? new Date().toISOString()),
    topics: Array.isArray(raw.topic)
      ? raw.topic
      : Array.isArray(raw.topics)
      ? raw.topics
      : raw.topic
      ? [raw.topic]
      : [],
    url: String(raw.contentUrl ?? raw.url ?? "#"),
    highlight: raw.highlight ?? undefined,
    isBookmarked: Boolean(raw.isBookmarked)
  };
}
export const useNewsStore = defineStore("news", () => {
  const items = ref<InsightArticle[]>(loadState<InsightArticle[]>(STORAGE_KEY, []));
  const state = ref<"idle" | "loading" | "success" | "error">(items.value.length ? "success" : "idle");
  const error = ref<string | null>(null);

  const latest = computed(() =>
    [...items.value].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
  );

  const topics = computed(() => Array.from(new Set(items.value.flatMap((article) => article.topics))));

  async function fetchNews() {
    state.value = "loading";
    error.value = null;
    try {
      items.value = (await fetchNewsApi()).map((article) => normalizeArticle(article));
      state.value = "success";
    } catch (err) {
      if (items.value.length) {
        state.value = "success";
        error.value = null;
        return;
      }
      state.value = "error";
      error.value = err instanceof Error ? err.message : "加载失败";
    }
  }

  function toggleBookmark(id: string) {
    items.value = items.value.map((article) =>
      article.id === id ? { ...article, isBookmarked: !article.isBookmarked } : article
    );
  }

  watch(
    items,
    (value) => saveState(STORAGE_KEY, value),
    { deep: true }
  );

  return {
    items,
    state,
    error,
    latest,
    topics,
    fetchNews,
    toggleBookmark
  };
});




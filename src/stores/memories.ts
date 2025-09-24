import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";

import { listMemories } from "@/services/mockApi/memories";
import { loadState, saveState } from "@/utils/storage";

export type MemoryMediaType = "image" | "video" | "audio" | "document" | "link";

export interface MemoryMedia {
  id: string;
  type: MemoryMediaType;
  url: string;
  name?: string;
  thumbnail?: string | null;
  transcript?: string | null;
  meta?: Record<string, unknown>;
}

export interface MemoryAnnotation {
  id: string;
  type: "note" | "audio" | "highlight";
  targetId: string;
  timestamp?: number;
  body: string;
  createdBy: string;
}

export interface MemoryInsights {
  summary: string;
  tone: "positive" | "neutral" | "negative";
  keywords: string[];
}

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  richText?: string;
  media: MemoryMedia[];
  coverId: string | null;
  createdAt: string;
  updatedAt: string;
  eventDate: string;
  people: string[];
  tags: string[];
  mood?: string;
  location?: string;
  insights: MemoryInsights;
  annotations: MemoryAnnotation[];
}

type LoadState = "idle" | "loading" | "success" | "error";

export interface MemoryDraft {
  id?: string;
  title: string;
  content: string;
  richText?: string;
  eventDate: string;
  mood?: string;
  tags: string[];
  media: MemoryMedia[];
  coverId?: string | null;
  location?: string;
}

const STORAGE_KEY = "memories";

const POSITIVE_WORDS = ["温暖", "开心", "欣慰", "轻松", "感动", "愉快", "惊喜", "满足", "亲密"];
const NEGATIVE_WORDS = ["担心", "焦虑", "疲惫", "遗憾", "失落", "难过", "沮丧"];

function analyzeTone(text: string): "positive" | "neutral" | "negative" {
  const lower = text.toLowerCase();
  const positiveScore = POSITIVE_WORDS.reduce((score, word) => (lower.includes(word) ? score + 1 : score), 0);
  const negativeScore = NEGATIVE_WORDS.reduce((score, word) => (lower.includes(word) ? score + 1 : score), 0);
  if (positiveScore > negativeScore) return "positive";
  if (negativeScore > positiveScore) return "negative";
  return "neutral";
}

function generateKeywords(text: string): string[] {
  const tokens = text
    .replace(/<[^>]*>/g, " ")
    .split(/[\s,.;!?，。！？\n]+/)
    .filter((token) => token.length >= 2 && token.length <= 8);
  const counts = new Map<string, number>();
  for (const token of tokens) {
    const key = token.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 5);
}

function createSummary(text: string): string {
  const plain = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "尚未撰写详细内容";
  if (plain.length <= 100) return plain;
  return `${plain.slice(0, 96)}...`;
}

function createId() {
  return `mm-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeMemory(raw: any): MemoryItem {
  const baseHtml = raw.richText ?? raw.content ?? "";
  const plain = baseHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const insights: MemoryInsights = raw.insights ?? {
    summary: createSummary(baseHtml || plain),
    tone: analyzeTone(plain),
    keywords: generateKeywords(plain)
  };

  return {
    id: String(raw.id ?? createId()),
    title: String(raw.title ?? "未命名回忆"),
    content: String(raw.content ?? plain),
    richText: raw.richText ? String(raw.richText) : plain,
    media: Array.isArray(raw.media)
      ? raw.media.map((item: any) => ({
          id: String(item.id ?? createId()),
          type: (item.type ?? "image") as MemoryMediaType,
          url: String(item.url ?? ""),
          name: item.name,
          thumbnail: item.thumbnail ?? null,
          transcript: item.transcript ?? null,
          meta: item.meta ?? undefined
        }))
      : [],
    coverId: raw.coverId ?? raw.media?.[0]?.id ?? null,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? raw.createdAt ?? new Date().toISOString()),
    eventDate: String(raw.eventDate ?? new Date().toISOString().slice(0, 10)),
    people: Array.isArray(raw.people) ? raw.people : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    mood: raw.mood ?? "",
    location: raw.location ?? "",
    insights,
    annotations: Array.isArray(raw.annotations) ? raw.annotations : []
  };
}

function buildMemory(draft: MemoryDraft): MemoryItem {
  const now = new Date();
  const base = draft.richText ?? draft.content ?? "";
  const summary = createSummary(base);
  const keywords = generateKeywords(base);
  const tone = analyzeTone(base);

  const id = draft.id ?? `m-${now.getTime()}`;
  const createdAt = draft.id ? new Date().toISOString() : now.toISOString();

  return {
    id,
    title: draft.title,
    content: draft.content,
    richText: draft.richText,
    media: draft.media,
    coverId: draft.coverId ?? draft.media[0]?.id ?? null,
    createdAt,
    updatedAt: createdAt,
    eventDate: draft.eventDate,
    people: [],
    tags: draft.tags,
    mood: draft.mood,
    location: draft.location,
    insights: {
      summary,
      tone,
      keywords
    },
    annotations: []
  };
}

export const useMemoriesStore = defineStore("memories", () => {
  const initial = loadState<MemoryItem[]>(STORAGE_KEY, []).map(normalizeMemory);
  const items = ref<MemoryItem[]>(initial);
  const state = ref<LoadState>(items.value.length ? "success" : "idle");
  const error = ref<string | null>(null);

  const highlighted = computed(() => items.value.slice(0, 3));
  const hasContent = computed(() => items.value.length > 0);
  const allTags = computed(() => Array.from(new Set(items.value.flatMap((memory) => memory.tags))));

  async function fetchMemories() {
    state.value = "loading";
    error.value = null;
    try {
      const remote = await listMemories();
      if (!items.value.length) {
        items.value = remote.map((memory) =>
          normalizeMemory({
            ...memory,
            updatedAt: memory.createdAt
          })
        );
      }
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

  function addMemory(draft: MemoryDraft) {
    const memory = buildMemory(draft);
    items.value = [memory, ...items.value];
    return memory;
  }

  function updateMemory(id: string, draft: MemoryDraft) {
    const index = items.value.findIndex((item) => item.id === id);
    if (index === -1) return;
    const base = items.value[index];
    const updated = buildMemory({ ...draft, id });
    updated.createdAt = base.createdAt;
    updated.updatedAt = new Date().toISOString();
    items.value.splice(index, 1, updated);
    return updated;
  }

  function removeMemory(id: string) {
    const index = items.value.findIndex((item) => item.id === id);
    if (index === -1) return;
    const [removed] = items.value.splice(index, 1);
    return removed;
  }

  watch(
    items,
    (value) => {
      saveState(STORAGE_KEY, value);
    },
    { deep: true }
  );

  return {
    items,
    state,
    error,
    highlighted,
    hasContent,
    allTags,
    fetchMemories,
    addMemory,
    updateMemory,
    removeMemory
  };
});

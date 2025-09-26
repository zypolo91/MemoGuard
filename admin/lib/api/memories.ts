import { apiFetch } from "./client";
import type { MemoryPayload, MemoryUpdatePayload } from "@/lib/dto/memories";

export interface MemoryListParams {
  tag?: string;
  from?: string;
  to?: string;
}

export interface MemoryRecord {
  id: string;
  title: string;
  content: string;
  richText?: string | null;
  eventDate: string;
  mood?: string | null;
  location?: string | null;
  tags: string[];
  people: string[];
  createdAt: string;
  updatedAt: string;
  media: Array<{
    id: string;
    type: string;
    url: string;
    thumbnailUrl?: string | null;
    altText?: string | null;
  }>;
  annotations: Array<{
    id: string;
    type: string;
    payload: Record<string, unknown>;
    createdAt: string;
  }>;
  insights: Array<{
    id: string;
    summary: string;
    highlights: string[];
    createdAt: string;
  }>;
}

export async function listMemories(params: MemoryListParams = {}) {
  const search = new URLSearchParams();
  if (params.tag) search.set("tag", params.tag);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const query = search.toString();
  return apiFetch<MemoryRecord[]>(`/api/memories${query ? `?${query}` : ""}`);
}

export async function createMemory(payload: MemoryPayload) {
  return apiFetch<MemoryRecord>("/api/memories", {
    method: "POST",
    json: payload
  });
}

export async function updateMemory(id: string, payload: MemoryUpdatePayload) {
  return apiFetch<MemoryRecord>(`/api/memories/${id}`, {
    method: "PATCH",
    json: payload
  });
}

export async function deleteMemory(id: string) {
  await apiFetch<void>(`/api/memories/${id}`, {
    method: "DELETE"
  });
}

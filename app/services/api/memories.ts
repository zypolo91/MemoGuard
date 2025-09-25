import { apiFetch } from "./client";

export interface RemoteMemoryMedia {
  id: string;
  type: string;
  url: string;
  thumbnailUrl?: string | null;
  altText?: string | null;
}

export interface RemoteMemory {
  id: string;
  title: string;
  content: string;
  richText?: string | null;
  eventDate: string;
  mood?: string | null;
  location?: string | null;
  tags: string[];
  people: string[];
  media: RemoteMemoryMedia[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchMemories(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  return apiFetch<RemoteMemory[]>(`/memories${query}`, { method: "GET" });
}

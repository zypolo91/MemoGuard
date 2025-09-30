import { and, eq } from "drizzle-orm";
import { memories, memoryMedia } from "../schema/memories";
import { getDb } from "../utils/db";
import { createId } from "../utils/id";
import type { MemoryPayload, MemoryUpdatePayload } from "../dto/memories";

function isWithinRange(date: string, { from, to }: { from?: string; to?: string }) {
  if (!from && !to) return true;
  const ts = new Date(date).getTime();
  if (from && ts < new Date(from).getTime()) return false;
  if (to && ts > new Date(to).getTime()) return false;
  return true;
}

export async function listMemories(ownerAdminId: string, params: { tag?: string; from?: string; to?: string }) {
  const db = getDb();
  const base = await db.query.memories.findMany({
    with: {
      media: true,
      annotations: true,
      insights: true
    },
    where: (fields, operators) => operators.eq(fields.ownerAdminId, ownerAdminId),
    orderBy: (fields, { desc }) => desc(fields.eventDate)
  });

  return base.filter((memory) => {
    const tagOk = params.tag ? memory.tags.includes(params.tag) : true;
    const rangeOk = isWithinRange(memory.eventDate, params);
    return tagOk && rangeOk;
  });
}

export async function getMemory(ownerAdminId: string, id: string) {
  const db = getDb();
  const record = await db.query.memories.findFirst({
    with: {
      media: true,
      annotations: true,
      insights: true
    },
    where: (fields, operators) => and(operators.eq(fields.id, id), operators.eq(fields.ownerAdminId, ownerAdminId))
  });
  return record ?? null;
}

export async function createMemory(ownerAdminId: string, payload: MemoryPayload) {
  const db = getDb();
  const memoryId = createId();

  await db.insert(memories).values({
    id: memoryId,
    title: payload.title,
    content: payload.content,
    richText: payload.richText,
    eventDate: payload.eventDate,
    mood: payload.mood,
    location: payload.location,
    tags: payload.tags,
    people: payload.people,
    ownerAdminId
  });

  if (payload.media.length) {
    await db.insert(memoryMedia).values(
      payload.media.map((item) => ({
        id: item.id ?? createId(),
        memoryId,
        type: item.type,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        altText: item.altText
      }))
    );
  }

  return getMemory(ownerAdminId, memoryId);
}

export async function updateMemory(ownerAdminId: string, id: string, payload: MemoryUpdatePayload) {
  const db = getDb();

  if (Object.keys(payload).length) {
    await db
      .update(memories)
      .set({
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.content !== undefined && { content: payload.content }),
        ...(payload.richText !== undefined && { richText: payload.richText }),
        ...(payload.eventDate !== undefined && { eventDate: payload.eventDate }),
        ...(payload.mood !== undefined && { mood: payload.mood }),
        ...(payload.location !== undefined && { location: payload.location }),
        ...(payload.tags !== undefined && { tags: payload.tags }),
        ...(payload.people !== undefined && { people: payload.people })
      })
      .where(and(eq(memories.id, id), eq(memories.ownerAdminId, ownerAdminId)));
  }

  if (payload.media) {
    await db.delete(memoryMedia).where(eq(memoryMedia.memoryId, id));
    if (payload.media.length) {
      await db.insert(memoryMedia).values(
        payload.media.map((item) => ({
          id: item.id ?? createId(),
          memoryId: id,
          type: item.type,
          url: item.url,
          thumbnailUrl: item.thumbnailUrl,
          altText: item.altText
        }))
      );
    }
  }

  return getMemory(ownerAdminId, id);
}

export async function deleteMemory(ownerAdminId: string, id: string) {
  const db = getDb();
  await db.delete(memories).where(and(eq(memories.id, id), eq(memories.ownerAdminId, ownerAdminId)));
}

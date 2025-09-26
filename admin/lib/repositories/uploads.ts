import { desc, eq, sql } from "drizzle-orm";
import { uploadRecords } from "../schema/uploads";
import { getDb } from "../utils/db";

export interface UploadRecordInput {
  id: string;
  bucket: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  originalName: string;
}

export async function createUploadRecord(input: UploadRecordInput) {
  const db = getDb();
  await db.insert(uploadRecords).values({
    id: input.id,
    bucket: input.bucket,
    path: input.path,
    url: input.url,
    mimeType: input.mimeType,
    size: input.size,
    originalName: input.originalName
  });
}

export async function deleteUploadRecordByPath(bucket: string, path: string) {
  const db = getDb();
  await db.delete(uploadRecords).where(sql`(${uploadRecords.bucket}) = ${bucket} AND (${uploadRecords.path}) = ${path}`);
}

export async function listUploadRecords(query: { page?: number; pageSize?: number }) {
  const db = getDb();
  const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 10));
  const page = Math.max(1, query.page ?? 1);
  const offset = (page - 1) * pageSize;

  const [items, totalRow] = await Promise.all([
    db
      .select()
      .from(uploadRecords)
      .orderBy(desc(uploadRecords.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(uploadRecords)
  ]);

  const total = Number(totalRow[0]?.count ?? 0);

  return {
    data: items,
    pagination: { page, pageSize, total }
  };
}

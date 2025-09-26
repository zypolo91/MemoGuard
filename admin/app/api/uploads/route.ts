import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

import { assertSupabaseCredentials } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { jsonCreated, jsonError, jsonNoContent } from "@/lib/utils/http";
import { createUploadRecord, deleteUploadRecordByPath, listUploadRecords } from "@/lib/repositories/uploads";
import { createId } from "@/lib/utils/id";

export const runtime = "nodejs";

const ensuredBuckets = new Set<string>();

function resolveStatusCode(error?: { statusCode?: number | string; status?: number }) {
  if (!error) return undefined;
  const raw = error.statusCode ?? error.status;
  if (raw === undefined || raw === null) return undefined;
  const numeric = typeof raw === "string" ? Number(raw) : raw;
  return Number.isFinite(numeric) ? Number(numeric) : undefined;
}

async function ensureBucketExists(client: SupabaseClient, bucket: string) {
  if (ensuredBuckets.has(bucket)) {
    return;
  }

  const { data, error } = await client.storage.getBucket(bucket);

  const statusCode = resolveStatusCode(error);
  if (error && statusCode !== 404) {
    throw error;
  }

  if (!data) {
    const { error: createError } = await client.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: "50MB"
    });

    const createStatus = resolveStatusCode(createError);
    if (createError && createStatus !== 409) {
      throw createError;
    }
  }

  ensuredBuckets.add(bucket);
}

function normalizeFolder(folder: string | null): string | undefined {
  if (!folder) return undefined;
  const trimmed = folder.trim();
  if (!trimmed) return undefined;
  const safe = trimmed
    .replace(/\.\./g, "")
    .split(/[\\/]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
  return safe || undefined;
}

function getFileExtension(name: string | undefined | null) {
  if (!name) return "";
  const lastDot = name.lastIndexOf(".");
  if (lastDot === -1 || lastDot === name.length - 1) {
    return "";
  }
  return name.slice(lastDot);
}

export async function POST(request: NextRequest) {
  try {
    const { bucket } = assertSupabaseCredentials();
    const client = getSupabaseAdminClient();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError(400, "invalid_request", "请上传文件");
    }

    const folder = normalizeFolder(formData.get("folder") as string | null);

    const id = createId();
    const extension = getFileExtension(file.name);
    const filePath = [folder, `${id}${extension}`].filter(Boolean).join("/");

    await ensureBucketExists(client, bucket);

    const { error: uploadError } = await client.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream"
    });

    if (uploadError) {
      console.error("Supabase upload error", uploadError);
      return jsonError(500, "upload_failed", "文件上传失败，请稍后再试");
    }

    const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(filePath);
    const url = publicUrlData.publicUrl;

    await createUploadRecord({
      id,
      bucket,
      path: filePath,
      url,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      originalName: file.name
    });

    return jsonCreated({
      id,
      bucket,
      path: filePath,
      url,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      originalName: file.name,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Supabase 未配置")) {
      return jsonError(503, "supabase_not_configured", "Supabase 存储尚未配置，请联系管理员");
    }

    console.error(error);
    return jsonError(500, "unexpected_error", "上传失败");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { bucket } = assertSupabaseCredentials();
    const client = getSupabaseAdminClient();
    const body = await request.json().catch(() => ({} as any));
    const path = (body?.path as string | undefined)?.trim();
    const targetBucket = (body?.bucket as string | undefined)?.trim() || bucket;

    if (!path) {
      return jsonError(400, "invalid_request", "缺少路径 path");
    }

    const { error } = await client.storage.from(targetBucket).remove([path]);
    if (error) {
      console.error("Supabase remove error", error);
      return jsonError(500, "delete_failed", "删除失败，请稍后再试");
    }

    await deleteUploadRecordByPath(targetBucket, path);

    return jsonNoContent();
  } catch (error) {
    if (error instanceof Error && error.message.includes("Supabase 未配置")) {
      return jsonError(503, "supabase_not_configured", "Supabase 存储尚未配置，请联系管理员");
    }
    console.error(error);
    return jsonError(500, "unexpected_error", "删除失败");
  }
}

export async function GET(request: NextRequest) {
  try {
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "10");
    const result = await listUploadRecords({ page, pageSize });
    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取上传记录失败");
  }
}
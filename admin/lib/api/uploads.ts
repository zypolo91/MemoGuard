export interface UploadPayload {
  file: File;
  folder?: string;
}

export interface UploadRecord {
  id: string;
  bucket: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  originalName: string;
  createdAt: string;
}

export interface UploadListResult {
  data: UploadRecord[];
  pagination: { page: number; pageSize: number; total: number };
}

interface ErrorResponse {
  error?: {
    message?: string;
  };
}

export async function listUploads(page = 1, pageSize = 10): Promise<UploadListResult> {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const res = await fetch(`/api/uploads?${query.toString()}`);
  if (!res.ok) throw new Error(`获取上传记录失败(${res.status})`);
  return (await res.json()) as UploadListResult;
}

export async function createUpload(payload: UploadPayload): Promise<UploadRecord> {
  const formData = new FormData();
  formData.append("file", payload.file);
  if (payload.folder) {
    formData.append("folder", payload.folder);
  }

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    let message = "上传失败";

    try {
      const body = (await response.json()) as ErrorResponse;
      if (body?.error?.message) {
        message = body.error.message;
      }
    } catch (error) {
      console.warn("Failed to parse upload error response", error);
    }

    throw new Error(message);
  }

  return (await response.json()) as UploadRecord;
}

export async function deleteUpload(input: { path: string; bucket?: string }): Promise<void> {
  const response = await fetch("/api/uploads", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    let message = "删除失败";
    try {
      const body = (await response.json()) as ErrorResponse;
      if (body?.error?.message) message = body.error.message;
    } catch {}
    throw new Error(message);
  }
}

import { apiFetch } from "./client";

export interface UploadRequestPayload {
  url?: string;
  thumbnail?: string;
}

export interface UploadRecord {
  id: string;
  url: string;
  thumbnail: string | null;
}

export async function createUpload(payload: UploadRequestPayload = {}) {
  return apiFetch<UploadRecord>("/api/uploads", {
    method: "POST",
    json: payload
  });
}

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

interface ErrorResponse {
  error?: {
    message?: string;
  };
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

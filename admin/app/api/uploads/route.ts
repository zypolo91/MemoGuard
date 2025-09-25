import { NextRequest } from "next/server";
import { jsonCreated, jsonError } from "@/lib/utils/http";
import { createId } from "@/lib/utils/id";

export async function POST(request: NextRequest) {
  try {
    // In production this should forward to object storage such as S3 or UploadThing.
    const body = await request.json().catch(() => ({}));
    const id = createId();
    return jsonCreated({
      id,
      url: body.url ?? `https://files.memoguard.local/${id}`,
      thumbnail: body.thumbnail ?? null
    });
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "上传失败");
  }
}

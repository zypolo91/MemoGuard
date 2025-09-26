import { NextRequest } from "next/server";
import { memoryPayloadSchema, memoryQuerySchema } from "@/lib/dto/memories";
import { createMemory, listMemories } from "@/lib/repositories/memories";
import { jsonCreated, jsonError, jsonOk } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filter = memoryQuerySchema.safeParse(searchParams);
    if (!filter.success) {
      return jsonError(400, "invalid_query", filter.error.errors.map((issue) => issue.message).join("; "));
    }

    const data = await listMemories(filter.data);
    return jsonOk(data);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "无法获取记忆列表");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = memoryPayloadSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const created = await createMemory(payload.data);
    return jsonCreated(created);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "创建记忆失败");
  }
}

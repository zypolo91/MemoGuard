import { NextRequest } from "next/server";
import { userCreateSchema, userQuerySchema } from "@/lib/dto/users";
import { createUser, listUsers } from "@/lib/repositories/users";
import { jsonCreated, jsonError, jsonOk } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = userQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return jsonError(400, "invalid_query", parsed.error.errors.map((issue) => issue.message).join("; "));
    }
    const result = await listUsers(parsed.data);
    return jsonOk(result);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取用户列表失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(422, "validation_error", parsed.error.errors.map((issue) => issue.message).join("; "));
    }
    const created = await createUser(parsed.data);
    return jsonCreated(created);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "创建用户失败");
  }
}

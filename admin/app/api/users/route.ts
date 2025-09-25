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
    return jsonError(500, "unexpected_error", "\u83B7\u53D6\u7528\u6237\u5217\u8868\u5931\u8D25");
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
    return jsonError(500, "unexpected_error", "\u521B\u5EFA\u7528\u6237\u5931\u8D25");
  }
}

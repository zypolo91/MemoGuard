import { NextRequest } from "next/server";
import { adminUserUpdateSchema } from "@/lib/dto/admin-users";
import { deleteAdminUser, getAdminUser, updateAdminUser } from "@/lib/repositories/admin-users";
import { jsonError, jsonNoContent, jsonOk } from "@/lib/utils/http";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const record = await getAdminUser(context.params.id);
    if (!record) {
      return jsonError(404, "not_found", "\u7BA1\u7406\u5458\u4E0D\u5B58\u5728");
    }
    return jsonOk(record);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "\u83B7\u53D6\u7BA1\u7406\u5458\u5931\u8D25");
  }
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const parsed = adminUserUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(422, "validation_error", parsed.error.errors.map((issue) => issue.message).join("; "));
    }
    const updated = await updateAdminUser(context.params.id, parsed.data);
    if (!updated) {
      return jsonError(404, "not_found", "\u7BA1\u7406\u5458\u4E0D\u5B58\u5728");
    }
    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "\u66F4\u65B0\u7BA1\u7406\u5458\u5931\u8D25");
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  try {
    await deleteAdminUser(context.params.id);
    return jsonNoContent();
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "\u5220\u9664\u7BA1\u7406\u5458\u5931\u8D25");
  }
}

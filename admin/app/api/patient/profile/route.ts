import { NextRequest } from "next/server";
import { patientProfileUpdateSchema } from "@/lib/dto/patient";
import { getPatientProfile, updatePatientProfile, upsertDefaultPatientProfile } from "@/lib/repositories/patient";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { getActiveAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "请先登录");
    const profile = (await getPatientProfile(me.id)) ?? (await upsertDefaultPatientProfile(me.id));
    return jsonOk(profile);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取患者档案失败");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = patientProfileUpdateSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "请先登录");
    const updated = await updatePatientProfile(me.id, payload.data);
    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "更新患者档案失败");
  }
}


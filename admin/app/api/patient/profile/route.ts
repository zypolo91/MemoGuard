import { NextRequest } from "next/server";
import { patientProfileUpdateSchema } from "@/lib/dto/patient";
import { getPatientProfile, updatePatientProfile, upsertDefaultPatientProfile } from "@/lib/repositories/patient";
import { jsonError, jsonOk } from "@/lib/utils/http";

export async function GET() {
  try {
    const profile = (await getPatientProfile()) ?? (await upsertDefaultPatientProfile());
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
    const updated = await updatePatientProfile(payload.data);
    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "更新患者档案失败");
  }
}

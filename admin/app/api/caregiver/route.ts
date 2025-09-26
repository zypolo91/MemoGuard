import { NextRequest } from "next/server";
import { caregiverUpdateSchema } from "@/lib/dto/caregiver";
import { ensureCaregiverProfile, getCaregiverProfile, updateCaregiverProfile } from "@/lib/repositories/caregiver";
import { jsonError, jsonOk } from "@/lib/utils/http";

export async function GET() {
  try {
    const profile = (await getCaregiverProfile()) ?? (await ensureCaregiverProfile());
    return jsonOk(profile);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取照护者信息失败");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = caregiverUpdateSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const updated = await updateCaregiverProfile(payload.data);
    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "更新照护者信息失败");
  }
}

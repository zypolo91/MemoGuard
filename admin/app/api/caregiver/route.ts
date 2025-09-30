import { NextRequest } from "next/server";
import { caregiverUpdateSchema } from "@/lib/dto/caregiver";
import { ensureCaregiverProfile, getCaregiverProfile, updateCaregiverProfile } from "@/lib/repositories/caregiver";
import { jsonError, jsonOk } from "@/lib/utils/http";
import { getActiveAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "please login");
    const profile = (await getCaregiverProfile(me.id)) ?? (await ensureCaregiverProfile(me.id));
    return jsonOk(profile);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "failed to fetch caregiver profile");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = caregiverUpdateSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "please login");
    const updated = await updateCaregiverProfile(me.id, payload.data);
    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "failed to update caregiver profile");
  }
}
import { NextRequest } from "next/server";
import { patientAssessmentPayloadSchema } from "@/lib/dto/patient";
import { createPatientAssessment, listAssessmentTemplates, listPatientAssessments } from "@/lib/repositories/patient";
import { jsonCreated, jsonError, jsonOk } from "@/lib/utils/http";
import { getActiveAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "请先登录");
    const [assessments, templates] = await Promise.all([
      listPatientAssessments(me.id),
      listAssessmentTemplates()
    ]);
    return jsonOk({ assessments, templates });
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取评估记录失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = patientAssessmentPayloadSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const me = await getActiveAdmin();
    if (!me) return jsonError(401, "unauthorized", "请先登录");
    const created = await createPatientAssessment(me.id, payload.data);
    return jsonCreated(created);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "创建评估记录失败");
  }
}


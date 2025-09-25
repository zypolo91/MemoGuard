import { NextRequest } from "next/server";
import { patientAssessmentPayloadSchema } from "@/lib/dto/patient";
import { createPatientAssessment, listAssessmentTemplates, listPatientAssessments } from "@/lib/repositories/patient";
import { jsonCreated, jsonError, jsonOk } from "@/lib/utils/http";

export async function GET() {
  try {
    const [assessments, templates] = await Promise.all([
      listPatientAssessments(),
      listAssessmentTemplates()
    ]);
    return jsonOk({ assessments, templates });
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取评估数据失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = patientAssessmentPayloadSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const created = await createPatientAssessment(payload.data);
    return jsonCreated(created);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "创建评估记录失败");
  }
}

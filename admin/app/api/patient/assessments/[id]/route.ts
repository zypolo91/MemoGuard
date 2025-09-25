import { NextRequest } from "next/server";
import { patientAssessmentUpdateSchema } from "@/lib/dto/patient";
import { deletePatientAssessment, getPatientAssessment, updatePatientAssessment } from "@/lib/repositories/patient";
import { jsonError, jsonNoContent, jsonOk } from "@/lib/utils/http";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const record = await getPatientAssessment(context.params.id);
    if (!record) {
      return jsonError(404, "not_found", "评估记录不存在");
    }
    return jsonOk(record);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "获取评估记录失败");
  }
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const payload = patientAssessmentUpdateSchema.safeParse(body);
    if (!payload.success) {
      return jsonError(422, "validation_error", payload.error.errors.map((issue) => issue.message).join("; "));
    }
    const updated = await updatePatientAssessment(context.params.id, payload.data);
    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "更新评估记录失败");
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  try {
    await deletePatientAssessment(context.params.id);
    return jsonNoContent();
  } catch (error) {
    console.error(error);
    return jsonError(500, "unexpected_error", "删除评估记录失败");
  }
}

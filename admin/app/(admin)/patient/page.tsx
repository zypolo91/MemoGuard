"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import {
  createAssessment,
  deleteAssessment,
  getPatientProfile,
  listAssessments,
  updateAssessment,
  updatePatientProfile,
  type AssessmentTemplateRecord,
  type PatientAssessmentRecord,
  type PatientProfileRecord
} from "@/lib/api/patient";
import type { PatientAssessmentPayload, PatientAssessmentUpdate, PatientProfileUpdate } from "@/lib/dto/patient";

const metricOptions = [
  { value: "tau", label: "Tau 蛋白" },
  { value: "amyloid", label: "β-淀粉样" },
  { value: "metabolism", label: "代谢水平" },
  { value: "cognition", label: "认知能力" },
  { value: "score", label: "综合评分" }
] as const;

const statusOptions = [
  { value: "stable", label: "稳定" },
  { value: "improving", label: "好转" },
  { value: "declining", label: "下降" },
  { value: "critical", label: "危急" }
] as const;

const profileFormSchema = z.object({
  fullName: z.string().trim().min(1, "请输入姓名").max(120, "姓名不超过 120 个字符"),
  avatarUrl: z.string().url("请输入合法的头像链接").optional().or(z.literal("")),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, "日期格式需为 YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  diagnosis: z.string().max(160, "诊断信息不超过 160 字").optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal(""))
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const assessmentFormSchema = z.object({
  templateId: z.string().trim().min(1, "请选择评估模板"),
  label: z.string().max(120, "标签不超过 120 字").optional().or(z.literal("")),
  metric: z.enum(["tau", "amyloid", "metabolism", "cognition", "score"] as const),
  value: z.coerce.number({ invalid_type_error: "请输入评估数值" }),
  unit: z.string().max(24, "单位不超过 24 字").optional().or(z.literal("")),
  status: z.enum(["stable", "improving", "declining", "critical"] as const),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, "日期格式需为 YYYY-MM-DD")
    .min(1, "请选择日期"),
  notes: z.string().optional().or(z.literal(""))
});

type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

type AssessmentFormMode = "create" | "edit";

type AssessmentFormProps = {
  mode: AssessmentFormMode;
  defaultValues: AssessmentFormValues;
  templates: AssessmentTemplateRecord[];
  submitting: boolean;
  onSubmit: (values: AssessmentFormValues) => void;
};

function toProfileDefaults(profile: PatientProfileRecord | null): ProfileFormValues {
  return {
    fullName: profile?.fullName ?? "",
    avatarUrl: profile?.avatarUrl ?? "",
    birthDate: profile?.birthDate ? profile.birthDate.slice(0, 10) : "",
    diagnosis: profile?.diagnosis ?? "",
    notes: profile?.notes ?? ""
  };
}

function buildProfilePayload(values: ProfileFormValues): PatientProfileUpdate {
  return {
    fullName: values.fullName.trim(),
    avatarUrl: values.avatarUrl?.trim() || undefined,
    birthDate: values.birthDate?.trim() || undefined,
    diagnosis: values.diagnosis?.trim() || undefined,
    notes: values.notes?.trim() || undefined
  };
}

function buildAssessmentPayload(values: AssessmentFormValues): PatientAssessmentPayload {
  return {
    templateId: values.templateId,
    label: values.label?.trim() || undefined,
    metric: values.metric,
    value: values.value,
    unit: values.unit?.trim() || "",
    status: values.status,
    notes: values.notes?.trim() || undefined,
    date: values.date
  };
}

function buildAssessmentUpdate(values: AssessmentFormValues): PatientAssessmentUpdate {
  return {
    templateId: values.templateId,
    label: values.label?.trim() || undefined,
    metric: values.metric,
    value: values.value,
    unit: values.unit?.trim() || "",
    status: values.status,
    notes: values.notes?.trim() || undefined,
    date: values.date
  };
}

function ProfileForm({ profile, isSaving, onSubmit }: { profile: PatientProfileRecord | null; isSaving: boolean; onSubmit: (values: ProfileFormValues) => void }) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toProfileDefaults(profile)
  });

  useEffect(() => {
    form.reset(toProfileDefaults(profile));
  }, [profile, form]);

  const handleSubmit = form.handleSubmit((values) => onSubmit(values));

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">姓名</label>
          <input
            type="text"
            {...form.register("fullName")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="患者姓名"
          />
          {form.formState.errors.fullName && (
            <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">头像链接</label>
          <input
            type="text"
            {...form.register("avatarUrl")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="https://..."
          />
          {form.formState.errors.avatarUrl && (
            <p className="text-sm text-destructive">{form.formState.errors.avatarUrl.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">出生日期</label>
          <input type="date" {...form.register("birthDate")} className="rounded-md border border-border px-3 py-2 text-sm" />
          {form.formState.errors.birthDate && (
            <p className="text-sm text-destructive">{form.formState.errors.birthDate.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">主要诊断</label>
          <input
            type="text"
            {...form.register("diagnosis")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="例如：阿尔兹海默症"
          />
          {form.formState.errors.diagnosis && (
            <p className="text-sm text-destructive">{form.formState.errors.diagnosis.message}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">照护备注</label>
        <textarea
          rows={4}
          {...form.register("notes")}
          className="rounded-md border border-border px-3 py-2 text-sm"
          placeholder="记录病史、注意事项等"
        />
        {form.formState.errors.notes && (
          <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>
        )}
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        >
          {isSaving ? "保存中..." : "保存资料"}
        </button>
      </div>
    </form>
  );
}


function AssessmentForm({ mode, defaultValues, templates, submitting, onSubmit }: AssessmentFormProps) {
  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues
  });

  const templateMap = useMemo(() => {
    const map = new Map<string, AssessmentTemplateRecord>();
    templates.forEach((tpl) => map.set(tpl.id, tpl));
    return map;
  }, [templates]);

  const selectedTemplateId = form.watch("templateId");

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  useEffect(() => {
    if (mode === "create") {
      const template = templateMap.get(selectedTemplateId ?? "");
      if (template) {
        form.setValue("metric", template.metric, { shouldDirty: true, shouldValidate: true });
        form.setValue("unit", template.defaultUnit ?? "", { shouldDirty: true });
      }
    }
  }, [selectedTemplateId, templateMap, mode, form]);

  const handleSubmit = form.handleSubmit((values) => onSubmit(values));

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">评估模板</label>
          <select {...form.register("templateId")} className="rounded-md border border-border px-3 py-2 text-sm">
            <option value="">请选择模板</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.title}
              </option>
            ))}
          </select>
          {form.formState.errors.templateId && (
            <p className="text-sm text-destructive">{form.formState.errors.templateId.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">自定义标签</label>
          <input
            type="text"
            {...form.register("label")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="可选：2025 Q1 复测"
          />
          {form.formState.errors.label && (
            <p className="text-sm text-destructive">{form.formState.errors.label.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">指标类型</label>
          <select {...form.register("metric")} className="rounded-md border border-border px-3 py-2 text-sm">
            {metricOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          {form.formState.errors.metric && (
            <p className="text-sm text-destructive">{form.formState.errors.metric.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">评估数值</label>
          <input
            type="number"
            step="0.01"
            {...form.register("value")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="请输入数值"
          />
          {form.formState.errors.value && (
            <p className="text-sm text-destructive">{form.formState.errors.value.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">计量单位</label>
          <input
            type="text"
            {...form.register("unit")}
            className="rounded-md border border-border px-3 py-2 text-sm"
            placeholder="例如：pg/mL"
          />
          {form.formState.errors.unit && (
            <p className="text-sm text-destructive">{form.formState.errors.unit.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">评估状态</label>
          <select {...form.register("status")} className="rounded-md border border-border px-3 py-2 text-sm">
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">记录日期</label>
          <input type="date" {...form.register("date")} className="rounded-md border border-border px-3 py-2 text-sm" />
          {form.formState.errors.date && (
            <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">补充说明</label>
        <textarea
          rows={4}
          {...form.register("notes")}
          className="rounded-md border border-border px-3 py-2 text-sm"
          placeholder="记录测量条件或额外说明"
        />
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        >
          {submitting ? "保存中..." : mode === "create" ? "创建评估" : "保存修改"}
        </button>
      </div>
    </form>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function formatValue(value: string, unit?: string | null) {
  const numeric = Number(value);
  const display = Number.isNaN(numeric) ? value : numeric.toString();
  return unit ? `${display} ${unit}` : display;
}

function getCreateDefaults(): AssessmentFormValues {
  return {
    templateId: "",
    label: "",
    metric: "tau",
    value: 0,
    unit: "",
    status: "stable",
    date: new Date().toISOString().slice(0, 10),
    notes: ""
  };
}

function toEditDefaults(record: PatientAssessmentRecord): AssessmentFormValues {
  return {
    templateId: record.templateId,
    label: record.label ?? "",
    metric: record.metric,
    value: Number(record.value),
    unit: record.unit ?? "",
    status: record.status,
    date: record.recordedAt.slice(0, 10),
    notes: record.notes ?? ""
  };
}

export default function PatientPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PatientAssessmentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PatientAssessmentRecord | null>(null);

  const profileQuery = useQuery({
    queryKey: ["patient", "profile"],
    queryFn: getPatientProfile
  });

  const assessmentsQuery = useQuery({
    queryKey: ["patient", "assessments"],
    queryFn: listAssessments
  });

  const profileMutation = useMutation({
    mutationFn: (values: ProfileFormValues) => updatePatientProfile(buildProfilePayload(values)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patient", "profile"] })
  });

  const createMutation = useMutation({
    mutationFn: (values: AssessmentFormValues) => createAssessment(buildAssessmentPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", "assessments"] });
      setCreateOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: AssessmentFormValues }) =>
      updateAssessment(id, buildAssessmentUpdate(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", "assessments"] });
      setEditTarget(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", "assessments"] });
      setDeleteTarget(null);
    }
  });

  const profile = profileQuery.data ?? null;
  const templates = assessmentsQuery.data?.templates ?? [];
  const assessments = assessmentsQuery.data?.assessments ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">患者档案</h2>
          <p className="text-sm text-muted-foreground">
            维护患者基础信息与评估记录，为个性化照护提供决策依据。
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        {profileQuery.isLoading && <p className="text-sm text-muted-foreground">正在加载患者资料...</p>}
        {profileQuery.isError && (
          <p className="text-sm text-destructive">加载失败：{(profileQuery.error as Error).message}</p>
        )}
        {profileQuery.isSuccess && (
          <ProfileForm
            profile={profile}
            isSaving={profileMutation.isPending}
            onSubmit={(values) => profileMutation.mutate(values)}
          />
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">评估记录</h3>
            <p className="text-sm text-muted-foreground">记录关键指标，辅助监测康复趋势。</p>
          </div>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            onClick={() => setCreateOpen(true)}
          >
            新建评估
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {assessmentsQuery.isLoading && <p className="text-sm text-muted-foreground">正在加载评估记录...</p>}
          {assessmentsQuery.isError && (
            <p className="text-sm text-destructive">加载失败：{(assessmentsQuery.error as Error).message}</p>
          )}
          {!assessmentsQuery.isLoading && assessments.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              当前暂无评估数据，可点击“新建评估”录入首条记录。
            </div>
          )}
          {assessments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">日期</th>
                    <th className="px-4 py-3">指标</th>
                    <th className="px-4 py-3">测量值</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">来源模板</th>
                    <th className="px-4 py-3">标签</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {assessments.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-2 text-muted-foreground">{formatDate(record.recordedAt)}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {metricOptions.find((item) => item.value === record.metric)?.label ?? record.metric}
                      </td>
                      <td className="px-4 py-2 font-medium text-foreground">{formatValue(record.value, record.unit)}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium">
                          {statusOptions.find((item) => item.value === record.status)?.label ?? record.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{record.template?.title ?? "-"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{record.label ?? "-"}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            className="rounded-md border border-border px-3 py-1 text-muted-foreground hover:bg-muted"
                            onClick={() => setEditTarget(record)}
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            className="rounded-md bg-destructive px-3 py-1 text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => setDeleteTarget(record)}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="新建评估">
        <AssessmentForm
          mode="create"
          defaultValues={getCreateDefaults()}
          templates={templates}
          submitting={createMutation.isPending}
          onSubmit={(values) => createMutation.mutate(values)}
        />
        {createMutation.isError && (
          <p className="mt-4 text-sm text-destructive">{(createMutation.error as Error).message}</p>
        )}
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="编辑评估">
        {editTarget && (
          <AssessmentForm
            mode="edit"
            defaultValues={toEditDefaults(editTarget)}
            templates={templates}
            submitting={updateMutation.isPending}
            onSubmit={(values) => updateMutation.mutate({ id: editTarget.id, values })}
          />
        )}
        {updateMutation.isError && (
          <p className="mt-4 text-sm text-destructive">{(updateMutation.error as Error).message}</p>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除评估记录"
        description={`确定要删除 ${deleteTarget ? formatDate(deleteTarget.recordedAt) : ""} 的评估吗？该操作无法撤销。`}
        confirmLabel={deleteMutation.isPending ? "删除中..." : "确认删除"}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}









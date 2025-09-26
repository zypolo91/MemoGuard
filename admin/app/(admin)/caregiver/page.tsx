"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Modal } from "@/components/ui/modal";
import { getCaregiverProfile, updateCaregiverProfile } from "@/lib/api/caregiver";
import type { CaregiverProfileRecord } from "@/lib/api/caregiver";
import type { CaregiverUpdatePayload } from "@/lib/dto/caregiver";

const topicDelimiter = /[,，\s]+/u;
const themeOptions = [
  { value: "auto", label: "跟随系统" },
  { value: "light", label: "浅色模式" },
  { value: "dark", label: "深色模式" }
] as const;

const languageOptions = [
  { value: "zh-CN", label: "简体中文" },
  { value: "en-US", label: "English" }
] as const;

const caregiverFormSchema = z.object({
  fullName: z.string().trim().min(1, "请输入姓名").max(120, "姓名不超过 120 个字符"),
  avatarUrl: z.string().url("请输入合法的头像链接").optional().or(z.literal("")),
  streak: z.string().trim().max(32).optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  notificationDailyDigest: z.boolean(),
  notificationNews: z.boolean(),
  notificationTasks: z.boolean(),
  language: z.enum(["zh-CN", "en-US"] as const),
  theme: z.enum(["auto", "light", "dark"] as const),
  followedTopics: z.string().optional().or(z.literal(""))
});

type CaregiverFormValues = z.infer<typeof caregiverFormSchema>;

type CaregiverFormProps = {
  profile: CaregiverProfileRecord;
  isSaving: boolean;
  onSubmit: (values: CaregiverFormValues) => void;
};

function toDefaultValues(profile: CaregiverProfileRecord): CaregiverFormValues {
  const preferences = profile.preferences ?? {
    notificationDailyDigest: true,
    notificationNews: true,
    notificationTasks: true,
    language: "zh-CN",
    theme: "auto",
    followedTopics: []
  };

  return {
    fullName: profile.fullName ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    streak: profile.streak ?? "",
    bio: profile.bio ?? "",
    notificationDailyDigest: preferences.notificationDailyDigest ?? true,
    notificationNews: preferences.notificationNews ?? true,
    notificationTasks: preferences.notificationTasks ?? true,
    language: preferences.language ?? "zh-CN",
    theme: preferences.theme ?? "auto",
    followedTopics: preferences.followedTopics?.join("，") ?? ""
  };
}

function buildPayload(values: CaregiverFormValues): CaregiverUpdatePayload {
  const followedTopics = values.followedTopics
    ? values.followedTopics
        .split(topicDelimiter)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return {
    fullName: values.fullName.trim(),
    avatarUrl: values.avatarUrl?.trim() || undefined,
    streak: values.streak?.trim() || undefined,
    bio: values.bio?.trim() || undefined,
    preferences: {
      notificationDailyDigest: values.notificationDailyDigest,
      notificationNews: values.notificationNews,
      notificationTasks: values.notificationTasks,
      language: values.language,
      theme: values.theme,
      followedTopics
    }
  };
}

function CaregiverForm({ profile, isSaving, onSubmit }: CaregiverFormProps) {
  const form = useForm<CaregiverFormValues>({
    resolver: zodResolver(caregiverFormSchema),
    defaultValues: toDefaultValues(profile)
  });

  useEffect(() => {
    form.reset(toDefaultValues(profile));
  }, [profile, form]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">姓名</label>
            <input
              type="text"
              {...form.register("fullName")}
              className="rounded-md border border-border px-3 py-2 text-sm"
              placeholder="照护者姓名"
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
            <label className="text-sm font-medium text-foreground">连续签到天数</label>
            <input
              type="text"
              {...form.register("streak")}
              className="rounded-md border border-border px-3 py-2 text-sm"
              placeholder="例如：12"
            />
            {form.formState.errors.streak && (
              <p className="text-sm text-destructive">{form.formState.errors.streak.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">个人简介</label>
            <textarea
              rows={6}
              {...form.register("bio")}
              className="rounded-md border border-border px-3 py-2 text-sm"
              placeholder="记录照护者背景、照护经验等"
            />
            {form.formState.errors.bio && (
              <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">通知与偏好</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("notificationDailyDigest")} /> 每日摘要通知
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("notificationNews")} /> 资讯推送通知
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("notificationTasks")} /> 任务提醒通知
          </label>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">界面语言</label>
            <select {...form.register("language")} className="rounded-md border border-border px-3 py-2 text-sm">
              {languageOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">主题模式</label>
            <select {...form.register("theme")} className="rounded-md border border-border px-3 py-2 text-sm">
              {themeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground">关注话题（逗号分隔）</label>
            <input
              type="text"
              {...form.register("followedTopics")}
              className="mt-1 rounded-md border border-border px-3 py-2 text-sm"
              placeholder="记忆训练, 康复课程"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        >
          {isSaving ? "保存中..." : "保存更新"}
        </button>
      </div>
    </form>
  );
}

export default function CaregiverPage() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["caregiver"],
    queryFn: getCaregiverProfile
  });

  const updateMutation = useMutation({
    mutationFn: (values: CaregiverFormValues) => updateCaregiverProfile(buildPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caregiver"] });
    }
  });

  const profile = profileQuery.data;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">照护者档案</h2>
          <p className="text-sm text-muted-foreground">
            维护照护者基础信息与通知偏好，确保沟通渠道畅通、任务提醒准确送达。
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        {profileQuery.isLoading && <p className="text-sm text-muted-foreground">正在加载照护者信息...</p>}
        {profileQuery.isError && (
          <p className="text-sm text-destructive">加载失败：{(profileQuery.error as Error).message}</p>
        )}
        {profile && (
          <CaregiverForm
            profile={profile}
            isSaving={updateMutation.isPending}
            onSubmit={(values) => updateMutation.mutate(values)}
          />
        )}
      </section>

      <Modal open={updateMutation.isError} onClose={() => updateMutation.reset()} title="更新失败">
        <p className="text-sm text-destructive">{(updateMutation.error as Error | null)?.message ?? "保存时发生未知错误"}</p>
      </Modal>
    </div>
  );
}


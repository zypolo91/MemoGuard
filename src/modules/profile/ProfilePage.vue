<template>
  <section class="space-y-6 py-6" v-if="profile">
    <PageHeader
      eyebrow="Profile & Activity"
      title="我的"
      description="了解照护档案、通知偏好和最新互动动态。"
    />

    <ProfileSummary :profile="profile" />
  </section>

  <section v-else class="flex min-h-[60vh] items-center justify-center">
    <UiCard padding="p-6" class="space-y-3 text-center">
      <h2 class="text-xl font-semibold text-content">尚未获取资料</h2>
      <p class="text-sm text-content/70">稍后可再次尝试刷新状态。</p>
      <button class="primary-button" type="button" @click="retry">重新加载</button>
    </UiCard>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";

import UiCard from "@/components/atoms/UiCard.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import ProfileSummary from "@/modules/profile/components/ProfileSummary.vue";
import { useMemoriesStore } from "@/stores/memories";
import { usePatientStore, type AssessmentMetric, type PatientAssessment } from "@/stores/patient";
import { useProfileStore } from "@/stores/profile";
import { useTasksStore } from "@/stores/tasks";

const metricLabels: Record<AssessmentMetric, string> = {
  score: "认知得分",
  tau: "Tau 蛋白",
  amyloid: "Aβ 蛋白",
};

const profileStore = useProfileStore();
const memoriesStore = useMemoriesStore();
const tasksStore = useTasksStore();
const patientStore = usePatientStore();

const { assessments } = storeToRefs(patientStore);

const activeView = ref("overview");
const viewOptions = [
  { label: "概览", value: "overview" },
  { label: "动态", value: "activity" },
];

onMounted(() => {
  if (profileStore.state === "idle") profileStore.fetchProfile();
  if (memoriesStore.state === "idle") memoriesStore.fetchMemories();
  if (tasksStore.state === "idle") tasksStore.fetchTasks();
});

const profile = computed(() => profileStore.profile);

const activityLog = computed(() => {
  const activities: Array<{ id: string; title: string; description: string; timestamp: string }> =
    [];
  if (memoriesStore.items.length) {
    const latest = memoriesStore.items[0];
    activities.push({
      id: `memory-${latest.id}`,
      title: "新增记忆",
      description: latest.title,
      timestamp: latest.createdAt,
    });
  }
  if (tasksStore.reminderLog.length) {
    const entry = tasksStore.reminderLog[0];
    activities.push({
      id: `task-${entry.timestamp}`,
      title: "任务提醒",
      description: entry.title,
      timestamp: entry.timestamp,
    });
  }
  if (assessments.value.length) {
    const latestAssessment = assessments.value[assessments.value.length - 1];
    activities.push({
      id: `assessment-${latestAssessment.id}`,
      title: "评估更新",
      description: summarizeAssessment(latestAssessment),
      timestamp: latestAssessment.date,
    });
  }
  return activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
});

function summarizeAssessment(entry: PatientAssessment): string {
  const parts: string[] = [];
  if (entry.value !== null) {
    const formatter = new Intl.NumberFormat("zh-CN", {
      maximumFractionDigits: entry.metric === "score" ? 1 : 2,
    });
    const unit = entry.unit || (entry.metric === "score" ? "分" : "pg/mL");
    parts.push(`${metricLabels[entry.metric]} ${formatter.format(entry.value)} ${unit}`.trim());
  }
  if (entry.status) {
    parts.push(entry.status);
  }
  return `${entry.label} · ${parts.join(" · ")}`;
}

function retry() {
  profileStore.fetchProfile();
}
</script>

<template>
  <section class="space-y-6 py-6" v-if="profile">
    <PageHeader
      eyebrow="Profile & Activity"
      title="我的"
      description="集中管理照护偏好、家人动态与数据导出。"
    />

    <ProfileSummary :profile="profile" />

    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-content/70">信息视图</h2>
      <SegmentedControl v-model="activeView" :options="viewOptions" />
    </div>

    <div v-if="activeView === 'overview'" class="grid gap-5 lg:grid-cols-[1.2fr,1fr]">
      <UiCard padding="p-6" class="space-y-3">
        <h3 class="text-base font-semibold text-content">通知偏好</h3>
        <ul class="space-y-3 text-sm text-content/70">
          <li class="flex items-center justify-between">
            <span>每日摘要</span>
            <span>{{ profile.preferences.notification.dailyDigest ? '开启' : '关闭' }}</span>
          </li>
          <li class="flex items-center justify-between">
            <span>资讯提示</span>
            <span>{{ profile.preferences.notification.news ? '开启' : '关闭' }}</span>
          </li>
          <li class="flex items-center justify-between">
            <span>任务提醒</span>
            <span>{{ profile.preferences.notification.tasks ? '开启' : '关闭' }}</span>
          </li>
        </ul>
        <button class="primary-button" type="button">调整通知设置</button>
      </UiCard>
      <UiCard padding="p-6" class="space-y-3">
        <h3 class="text-base font-semibold text-content">关注主题</h3>
        <div class="flex flex-wrap gap-2">
          <UiTag v-for="topic in profile.followedTopics" :key="topic">#{{ topic }}</UiTag>
        </div>
        <button type="button" class="text-xs text-primary underline-offset-2 hover:underline">管理主题</button>
      </UiCard>
    </div>

    <div v-else class="space-y-5">
      <ActivityTimeline :items="activityLog" />
      <UiCard padding="p-6" class="space-y-3">
        <h3 class="text-base font-semibold text-content">快捷导出</h3>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="rounded-full border border-outline/40 px-4 py-2 text-xs text-content/70 hover:text-primary">导出照护日志</button>
          <button type="button" class="rounded-full border border-outline/40 px-4 py-2 text-xs text-content/70 hover:text-primary">同步至医生</button>
          <button type="button" class="rounded-full border border-outline/40 px-4 py-2 text-xs text-content/70 hover:text-primary">下载饮食报告</button>
        </div>
      </UiCard>
    </div>
  </section>

  <section v-else class="flex min-h-[60vh] items-center justify-center">
    <UiCard padding="p-6" class="space-y-3 text-center">
      <h2 class="text-xl font-semibold text-content">暂未获取到资料</h2>
      <p class="text-sm text-content/70">请稍后重试或检查网络状态。</p>
      <button class="primary-button" type="button" @click="retry">重新载入</button>
    </UiCard>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import UiCard from "@/components/atoms/UiCard.vue";
import UiTag from "@/components/atoms/UiTag.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import SegmentedControl from "@/components/molecules/SegmentedControl.vue";
import ActivityTimeline from "@/modules/profile/components/ActivityTimeline.vue";
import ProfileSummary from "@/modules/profile/components/ProfileSummary.vue";
import { useMemoriesStore } from "@/stores/memories";
import { useProfileStore } from "@/stores/profile";
import { useRecipesStore } from "@/stores/recipes";
import { useTasksStore } from "@/stores/tasks";

const profileStore = useProfileStore();
const memoriesStore = useMemoriesStore();
const tasksStore = useTasksStore();
const recipesStore = useRecipesStore();

const activeView = ref("overview");
const viewOptions = [
  { label: "总览", value: "overview" },
  { label: "动态", value: "activity" }
];

onMounted(() => {
  if (profileStore.state === "idle") profileStore.fetchProfile();
  if (memoriesStore.state === "idle") memoriesStore.fetchMemories();
  if (tasksStore.state === "idle") tasksStore.fetchTasks();
  if (recipesStore.state === "idle") recipesStore.fetchRecipes();
});

const profile = computed(() => profileStore.profile);

const activityLog = computed(() => {
  const activities = [] as Array<{ id: string; title: string; description: string; timestamp: string }>;
  if (memoriesStore.items.length) {
    const latest = memoriesStore.items[0];
    activities.push({
      id: `memory-${latest.id}`,
      title: "新增回忆",
      description: latest.title,
      timestamp: latest.createdAt
    });
  }
  if (tasksStore.reminderLog.length) {
    const entry = tasksStore.reminderLog[0];
    activities.push({
      id: `task-${entry.timestamp}`,
      title: "完成任务",
      description: entry.title,
      timestamp: entry.timestamp
    });
  }
  if (recipesStore.bookmarked.length) {
    const recipe = recipesStore.bookmarked[0];
    activities.push({
      id: `recipe-${recipe.id}`,
      title: "收藏菜谱",
      description: recipe.title,
      timestamp: new Date().toISOString()
    });
  }
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
});

function retry() {
  profileStore.fetchProfile();
}
</script>

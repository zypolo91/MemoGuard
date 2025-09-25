<template>
  <UiCard class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-content">提醒偏好</h3>
        <p class="text-sm text-content/60">根据日程自动推送通知</p>
      </div>
      <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{{ enabledCount }} 项开启</span>
    </div>
    <ul class="space-y-3 text-sm text-content/70">
      <li class="flex items-center justify-between">
        <span>每日摘要</span>
        <span>{{ preferences.notification.dailyDigest ? '开启' : '关闭' }}</span>
      </li>
      <li class="flex items-center justify-between">
        <span>资讯提醒</span>
        <span>{{ preferences.notification.news ? '开启' : '关闭' }}</span>
      </li>
      <li class="flex items-center justify-between">
        <span>任务提醒</span>
        <span>{{ preferences.notification.tasks ? '开启' : '关闭' }}</span>
      </li>
    </ul>
    <button class="primary-button" type="button">调整偏好</button>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";

import UiCard from "@/components/atoms/UiCard.vue";
import type { ProfilePreferences } from "@/stores/profile";

const props = defineProps<{ preferences: ProfilePreferences }>();

const enabledCount = computed(() =>
  Object.values(props.preferences.notification).filter(Boolean).length
);
</script>

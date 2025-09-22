<template>
  <UiCard class="items-center gap-6 sm:flex-row sm:items-start" padding="p-6">
    <UiAvatar :src="profile.avatar" :name="profile.name" size="lg" />
    <div class="space-y-3">
      <div>
        <h2 class="text-2xl font-semibold text-content">{{ profile.name }}</h2>
        <p class="text-sm text-content/60">{{ profile.role }}</p>
      </div>
      <div class="flex flex-wrap gap-2 text-xs text-content/60">
        <UiTag v-for="focus in profile.careFocus" :key="focus">#{{ focus }}</UiTag>
      </div>
      <div class="flex items-center gap-4 text-sm text-content/70">
        <span class="rounded-full bg-primary/10 px-3 py-1 text-primary">连击 {{ profile.streak }} 天</span>
        <span>偏好语言：{{ profile.preferences.language }}</span>
        <span>主题：{{ profile.preferences.theme }}</span>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import UiAvatar from "@/components/atoms/UiAvatar.vue";
import UiCard from "@/components/atoms/UiCard.vue";
import UiTag from "@/components/atoms/UiTag.vue";
import type { CareProfile } from "@/stores/profile";

defineProps<{ profile: CareProfile }>();
</script>

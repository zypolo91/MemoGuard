<template>
  <UiCard class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-content">提醒记录</h3>
      <span class="text-xs text-content/60">最近 5 条</span>
    </div>
    <ul class="space-y-3 text-sm text-content/70">
      <li v-for="entry in entries" :key="entry.timestamp" class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <p class="font-medium text-content">{{ entry.title }}</p>
          <p class="text-xs text-content/60">{{ formatDate(entry.timestamp) }}</p>
        </div>
        <span class="rounded-full border border-outline/40 px-3 py-1 text-xs text-primary/80">{{ entry.status }}</span>
      </li>
    </ul>
  </UiCard>
</template>

<script setup lang="ts">
import UiCard from "@/components/atoms/UiCard.vue";

defineProps<{
  entries: Array<{ title: string; status: string; timestamp: string }>;
}>();

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
</script>

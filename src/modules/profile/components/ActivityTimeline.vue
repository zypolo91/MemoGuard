<template>
  <UiCard class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-content">最近动态</h3>
      <span class="text-xs text-content/60">过去 7 天</span>
    </div>
    <ul class="space-y-4">
      <li v-for="item in items" :key="item.id" class="flex items-start gap-3">
        <span class="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
        <div class="space-y-1 text-sm text-content/70">
          <p class="font-medium text-content">{{ item.title }}</p>
          <p>{{ item.description }}</p>
          <p class="text-xs text-content/50">{{ formatDate(item.timestamp) }}</p>
        </div>
      </li>
    </ul>
  </UiCard>
</template>

<script setup lang="ts">
import UiCard from "@/components/atoms/UiCard.vue";

defineProps<{
  items: Array<{ id: string; title: string; description: string; timestamp: string }>;
}>();

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
}
</script>

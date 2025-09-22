<template>
  <UiCard class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-content">个性化推荐</h3>
      <span class="text-xs text-content/60">基于饮食偏好</span>
    </div>
    <div class="flex gap-3 overflow-x-auto">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="min-w-[160px] rounded-2xl border border-outline/40 bg-surface-muted/60 p-4 text-left text-sm text-content/70 transition hover:-translate-y-0.5 hover:shadow-primary/20"
      >
        <p class="text-xs text-primary/70">{{ item.tag }}</p>
        <p class="mt-2 text-base font-semibold text-content">{{ item.title }}</p>
        <p class="mt-1 text-xs text-content/60">{{ item.caption }}</p>
      </button>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import UiCard from "@/components/atoms/UiCard.vue";

defineProps<{
  items: Array<{ id: string; title: string; caption: string; tag: string }>;
}>();
</script>

<template>
  <Transition name="sheet">
    <div
      v-if="open"
      class="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 px-4 py-8"
      @keydown.esc.prevent.stop="emit('close')"
    >
      <div class="w-full max-w-[360px] overflow-hidden rounded-3xl bg-surface shadow-2xl">
        <header class="border-b border-outline/30 px-5 py-4">
          <h2 class="text-lg font-semibold text-content">确认删除回忆</h2>
          <p class="mt-1 text-xs text-content/60">删除后无法恢复此回忆，也会移除相关多媒体。</p>
        </header>
        <div class="space-y-3 px-5 py-5 text-sm text-content/70">
          <p class="font-medium text-content">{{ memory?.title }}</p>
          <p>回忆日期：{{ formattedDate }}</p>
          <p v-if="memory?.insights.summary" class="rounded-2xl bg-surface-muted/60 px-4 py-2 text-xs text-content/60">
            {{ memory.insights.summary }}
          </p>
        </div>
        <div class="flex items-center gap-3 border-t border-outline/20 bg-surface px-5 py-4">
          <button
            type="button"
            class="flex-1 rounded-full border border-outline border-opacity-40 px-4 py-2 text-sm text-content/70"
            @click="emit('close')"
          >
            暂不删除
          </button>
          <button
            type="button"
            class="flex-1 rounded-full bg-danger px-4 py-2 text-sm font-medium text-white"
            @click="emit('confirm', memory?.id ?? '')"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { MemoryItem } from '@/stores/memories';

const props = defineProps<{ open: boolean; memory: MemoryItem | null }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'confirm', id: string): void }>();

const formattedDate = computed(() => {
  if (!props.memory) return '--';
  return new Date(props.memory.eventDate).toLocaleDateString('zh-CN', { dateStyle: 'medium' });
});
</script>

<template>
  <Transition name="sheet">
    <div
      v-if="open"
      class="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 px-4 py-8"
      @keydown.esc.prevent.stop="emit('close')"
    >
      <div class="w-full max-w-[360px] overflow-hidden rounded-3xl bg-surface shadow-2xl">
        <header class="border-b border-outline/30 px-5 py-4">
          <h2 class="text-lg font-semibold text-content">确认删除任务</h2>
          <p class="mt-1 text-xs text-content/60">删除后可在稍后重新创建，不会影响历史记录。</p>
        </header>
        <div class="space-y-3 px-5 py-5 text-sm text-content/70">
          <p class="font-medium text-content">{{ task?.title }}</p>
          <p>提醒时间：{{ formattedTime }}</p>
          <p v-if="task?.notes" class="rounded-2xl bg-surface-muted/60 px-4 py-2 text-xs text-content/60">{{ task.notes }}</p>
        </div>
        <div class="flex items-center gap-3 border-t border-outline/20 bg-surface px-5 py-4">
          <button type="button" class="flex-1 rounded-full border border-outline border-opacity-40 px-4 py-2 text-sm text-content/70" @click="emit('close')">
            暂不删除
          </button>
          <button type="button" class="flex-1 rounded-full bg-danger px-4 py-2 text-sm font-medium text-white" @click="emit('confirm', task?.id ?? '')">
            确认删除
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { CareTask } from "@/stores/tasks";

const props = defineProps<{ open: boolean; task: CareTask | null }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'confirm', id: string): void }>();

const formattedTime = computed(() => {
  if (!props.task) return '--';
  return new Date(props.task.startAt).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
});
</script>

<template>
  <Transition name="sheet">
    <div
      v-if="open"
      class="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 px-4 py-8"
      @keydown.esc.prevent.stop="emit('close')"
    >
      <div class="relative w-full max-w-[420px] overflow-hidden rounded-3xl bg-surface shadow-2xl">
        <header class="flex items-center justify-between border-b border-outline/30 px-5 py-4">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-primary/70">Daily Detail</p>
            <h2 class="text-lg font-semibold text-content">{{ formattedDate }}</h2>
            <p class="text-xs text-content/60">{{ entries.length ? `${entries.length} 条记录` : '暂无记录' }}</p>
          </div>
          <UiIconButton aria-label="关闭" @click="emit('close')">
            <XMarkIcon class="h-5 w-5" />
          </UiIconButton>
        </header>

        <div class="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-5">
          <ul v-if="entries.length" class="space-y-3">
            <li
              v-for="entry in entries"
              :key="entry.id"
              class="rounded-2xl border border-outline/20 bg-surface px-4 py-3 text-sm text-content"
            >
              <p class="font-medium">{{ entry.taskTitle }}</p>
              <p class="mt-1 text-xs text-content/60">{{ formatTime(entry.timestamp) }}</p>
              <span class="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-[11px] text-primary/80">
                {{ statusLabel(entry.status) }}
              </span>
            </li>
          </ul>
          <p v-else class="rounded-2xl bg-surface-muted/60 px-4 py-6 text-center text-sm text-content/60">
            当天暂无执行记录。
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";

import UiIconButton from "@/components/atoms/UiIconButton.vue";
import type { ReminderLogEntry } from "@/stores/tasks";

const props = defineProps<{ open: boolean; date: string | null; entries: ReminderLogEntry[] }>();

const emit = defineEmits<{ (e: "close"): void }>();

const formattedDate = computed(() => {
  if (!props.date) return "未选择日期";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(props.date));
});

function formatTime(value: string) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("zh-CN", { timeStyle: "short" }).format(new Date(value));
}

function statusLabel(status: string) {
  switch (status) {
    case "completed":
      return "已完成";
    case "skipped":
      return "已跳过";
    case "snoozed":
      return "已稍后";
    default:
      return "待执行";
  }
}
</script>



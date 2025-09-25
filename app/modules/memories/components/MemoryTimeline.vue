<template>
  <div class="relative space-y-6">
    <div class="absolute left-[18px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 to-transparent" />
    <div v-for="memory in memories" :key="memory.id" class="relative pl-10">
      <span
        class="absolute left-0 top-6 flex h-9 w-9 -translate-x-[7px] items-center justify-center rounded-full border border-primary/40 bg-surface text-xs font-semibold text-primary"
      >
        {{ timelineBadge(memory.eventDate) }}
      </span>
      <MemoryCard :memory="memory" @open="handleOpen" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MemoryCard from "./MemoryCard.vue";
import type { MemoryItem } from "@/stores/memories";

const props = defineProps<{ memories: MemoryItem[] }>();
const emit = defineEmits<{ (e: "open", memory: MemoryItem): void }>();

function timelineBadge(date: string) {
  const target = new Date(date);
  return String(target.getDate()).padStart(2, "0");
}

function handleOpen(memory: MemoryItem) {
  emit("open", memory);
}
</script>

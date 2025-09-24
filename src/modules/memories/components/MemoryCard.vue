<template>
  <UiCard hoverable class="cursor-pointer space-y-4" @click="emit('open', memory)">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-primary/70">{{ formattedDate }}</p>
        <h2 class="mt-1 text-lg font-semibold text-content">{{ memory.title }}</h2>
      </div>
      <span class="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{{ toneLabel }}</span>
    </div>

    <p class="text-sm leading-relaxed text-content/70">{{ memory.insights.summary }}</p>

    <div v-if="previewMedia.length" class="grid grid-cols-3 gap-2">
      <div
        v-for="item in previewMedia"
        :key="item.id"
        class="overflow-hidden rounded-2xl border border-outline/30 bg-surface-muted"
      >
        <img
          v-if="item.type === 'image'"
          :src="item.thumbnail ?? item.url"
          alt=""
          class="h-24 w-full object-cover"
        />
        <div v-else class="grid h-24 place-items-center text-xs text-content/60">
          {{ item.type.toUpperCase() }}
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 text-xs text-content/60">
      <UiTag v-for="tag in memory.tags" :key="tag">#{{ tag }}</UiTag>
      <span v-if="memory.location">📍 {{ memory.location }}</span>
    </div>

    <div class="flex items-center justify-between text-xs text-content/50">
      <span>更新于 {{ createdInfo }}</span>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { LinkIcon, PhotoIcon } from "@heroicons/vue/24/outline";

import UiCard from "@/components/atoms/UiCard.vue";
import UiTag from "@/components/atoms/UiTag.vue";
import type { MemoryItem, MemoryMediaType } from "@/stores/memories";

const props = defineProps<{ memory: MemoryItem }>();

const emit = defineEmits<{ (e: "open", memory: MemoryItem): void }>();

const formattedDate = computed(() =>
  new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(
    new Date(props.memory.eventDate),
  ),
);

const createdInfo = computed(() =>
  new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(props.memory.updatedAt),
  ),
);

const toneLabel = computed(() => {
  switch (props.memory.insights.tone) {
    case "positive":
      return "积极";
    case "negative":
      return "低落";
    default:
      return "平稳";
  }
});

const previewMedia = computed(() => props.memory.media.slice(0, 3));
</script>

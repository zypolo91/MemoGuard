<template>
  <Transition name="sheet">
    <div
      v-if="open"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 py-8"
    >
      <div
        class="relative flex max-h-[72vh] w-full max-w-[720px] flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl"
      >
        <header
          class="sticky top-0 flex items-center justify-between border-b border-outline/40 bg-surface px-6 py-5 shadow-sm"
        >
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-primary/70">记忆详情</p>
            <h2 class="text-lg font-semibold text-content">{{ memory?.title }}</h2>
          </div>
          <div class="flex items-center gap-2">
            <UiIconButton aria-label="编辑" @click="emit('edit')">
              <PencilSquareIcon class="h-5 w-5" />
            </UiIconButton>
            <UiIconButton aria-label="关闭" @click="emit('close')">
              <XMarkIcon class="h-5 w-5" />
            </UiIconButton>
          </div>
        </header>

        <div v-if="memory" class="flex-1 overflow-y-auto px-6 pb-12 pt-4">
          <div class="space-y-6">
            <div v-if="coverUrl" class="overflow-hidden rounded-3xl">
              <img :src="coverUrl" alt="封面" class="h-48 w-full object-cover" />
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs text-content/60">
              <div class="rounded-2xl bg-surface-muted/70 px-4 py-3">
                <p class="text-[11px] uppercase tracking-[0.3em] text-primary/70">发生时间</p>
                <p class="mt-1 text-sm text-content">{{ timelineText }}</p>
              </div>
              <div class="rounded-2xl bg-surface-muted/70 px-4 py-3">
                <p class="text-[11px] uppercase tracking-[0.3em] text-primary/70">心情</p>
                <p class="mt-1 text-sm text-content">{{ memory.mood ?? "未标注" }}</p>
              </div>
            </div>

            <div v-if="memory.tags.length" class="flex flex-wrap gap-2">
              <UiTag v-for="tag in memory.tags" :key="tag">#{{ tag }}</UiTag>
            </div>

            <UiCard padding="p-5" class="space-y-4">
              <h3 class="text-base font-semibold text-content">详细内容</h3>
              <p class="whitespace-pre-line text-sm leading-relaxed text-content/80">
                {{ memory.content }}
              </p>
            </UiCard>

            <div v-if="memory.media.length" class="space-y-3">
              <h3 class="text-sm font-semibold text-content">附件</h3>
              <UiCard
                v-for="item in memory.media"
                :key="item.id"
                padding="p-4"
                class="flex items-center justify-between gap-3"
              >
                <div class="flex items-center gap-3">
                  <div
                    v-if="item.type === 'image'"
                    class="h-16 w-16 overflow-hidden rounded-2xl bg-surface-muted"
                  >
                    <img
                      :src="item.thumbnail ?? item.url"
                      alt=""
                      class="h-full w-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"
                  >
                    <component :is="mediaIcon(item.type)" class="h-6 w-6" />
                  </div>
                  <div class="space-y-1 text-xs text-content/70">
                    <p class="font-medium text-content">{{ item.name ?? formatMediaName(item) }}</p>
                    <a
                      v-if="isLink(item)"
                      :href="item.url"
                      target="_blank"
                      rel="noopener"
                      class="text-primary underline underline-offset-2"
                      >打开链接</a
                    >
                  </div>
                </div>
                <a
                  :href="item.url"
                  target="_blank"
                  rel="noopener"
                  class="rounded-full border border-outline/40 px-3 py-1 text-xs text-content/60"
                  >查看</a
                >
              </UiCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { LinkIcon, PhotoIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/vue/24/outline";

import UiCard from "@/components/atoms/UiCard.vue";
import UiIconButton from "@/components/atoms/UiIconButton.vue";
import UiTag from "@/components/atoms/UiTag.vue";
import type { MemoryItem, MemoryMedia, MemoryMediaType } from "@/stores/memories";

const props = defineProps<{
  open: boolean;
  memory: MemoryItem | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "edit"): void;
}>();

const coverUrl = computed(() => {
  if (!props.memory) return null;
  const cover = props.memory.media.find((item) => item.id === props.memory?.coverId);
  return cover?.thumbnail ?? cover?.url ?? null;
});

const timelineText = computed(() => {
  if (!props.memory) return "--";
  const date = new Date(props.memory.eventDate);
  return date.toLocaleDateString("zh-CN", { dateStyle: "medium" });
});

function mediaIcon(type: MemoryMediaType) {
  switch (type) {
    case "video":
      return PhotoIcon;
    case "audio":
      return LinkIcon;
    case "document":
      return LinkIcon;
    case "link":
      return LinkIcon;
    default:
      return PhotoIcon;
  }
}

function formatMediaName(item: MemoryMedia) {
  if (item.type === "link") return "链接";
  return item.name ?? "附件";
}

function isLink(item: MemoryMedia) {
  return item.type === "link";
}
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition:
    transform 0.24s ease,
    opacity 0.24s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(20%);
  opacity: 0;
}
</style>

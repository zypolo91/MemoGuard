<template>
  <UiCard
    hoverable
    role="button"
    tabindex="0"
    class="cursor-pointer text-left focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/40"
    @click="$emit('open', article.url)"
    @keydown.enter.prevent="$emit('open', article.url)"
    @keydown.space.prevent="$emit('open', article.url)"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-2 flex-1">
        <div class="flex items-center justify-between text-xs text-content/60">
          <span>{{ article.source }}</span>
          <span>{{ publishedAt }}</span>
        </div>
        <h3 class="text-lg font-semibold text-content">{{ article.title }}</h3>
        <p class="text-sm text-content/70">{{ article.summary }}</p>
      </div>
      <UiIconButton aria-label="收藏资讯" class="shrink-0" @click.stop="$emit('bookmark', article.id)">
        <component
          :is="article.isBookmarked ? BookmarkSolidIcon : BookmarkIcon"
          class="h-5 w-5"
          :class="article.isBookmarked ? 'text-primary' : 'text-content/40'"
        />
      </UiIconButton>
    </div>

    <div class="flex flex-wrap gap-2 text-xs text-content/60">
      <UiTag v-for="topic in article.topics" :key="topic">#{{ topic }}</UiTag>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { BookmarkIcon } from "@heroicons/vue/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/vue/24/solid";

import UiCard from "@/components/atoms/UiCard.vue";
import UiIconButton from "@/components/atoms/UiIconButton.vue";
import UiTag from "@/components/atoms/UiTag.vue";
import type { InsightArticle } from "@/stores/news";

const props = defineProps<{ article: InsightArticle }>();

const publishedAt = computed(() =>
  new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(props.article.publishedAt))
);

defineEmits<{
  (e: "open", url: string): void;
  (e: "bookmark", id: string): void;
}>();
</script>

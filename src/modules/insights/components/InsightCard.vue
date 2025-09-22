<template>
  <UiCard class="space-y-4" hoverable>
    <div class="space-y-2">
      <div class="flex items-center justify-between text-xs text-content/60">
        <span>{{ article.source }}</span>
        <span>{{ publishedAt }}</span>
      </div>
      <h3 class="text-lg font-semibold text-content">{{ article.title }}</h3>
      <p class="text-sm text-content/70">{{ article.summary }}</p>
    </div>

    <div class="flex flex-wrap gap-2 text-xs text-content/60">
      <UiTag v-for="topic in article.topics" :key="topic">#{{ topic }}</UiTag>
    </div>

    <div class="flex items-center justify-between text-sm text-primary">
      <button type="button" class="underline-offset-2 hover:underline" @click="$emit('open', article.url)">
        阅读原文
      </button>
      <button type="button" class="text-xs" @click="$emit('bookmark', article.id)">
        {{ article.isBookmarked ? '取消收藏' : '收藏资讯' }}
      </button>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";

import UiCard from "@/components/atoms/UiCard.vue";
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

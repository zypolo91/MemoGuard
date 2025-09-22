<template>
  <div class="space-y-4">
    <InsightCard
      v-for="article in articles"
      :key="article.id"
      :article="article"
      @bookmark="$emit('bookmark', $event)"
      @open="$emit('open', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import InsightCard from "./InsightCard.vue";
import type { InsightArticle } from "@/stores/news";

defineProps<{ articles: InsightArticle[] }>();

defineEmits<{
  (e: "bookmark", id: string): void;
  (e: "open", url: string): void;
}>();
</script>

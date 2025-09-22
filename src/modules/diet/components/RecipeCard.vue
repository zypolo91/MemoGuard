<template>
  <UiCard class="space-y-4" hoverable>
    <div class="relative h-40 overflow-hidden rounded-2xl">
      <img :src="recipe.heroImage" :alt="recipe.title" class="h-full w-full object-cover" />
      <button
        type="button"
        class="absolute right-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-content/80 shadow"
        @click.stop="$emit('toggle-bookmark', recipe.id)"
      >
        {{ recipe.isBookmarked ? '已收藏' : '收藏' }}
      </button>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between text-xs text-content/60">
        <span>{{ totalTime }} 分钟 · {{ difficultyLabel }}</span>
        <span class="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">{{ recipe.tags[0] }}</span>
      </div>
      <h3 class="text-lg font-semibold text-content">{{ recipe.title }}</h3>
      <p class="text-sm text-content/70">{{ recipe.description }}</p>
    </div>

    <div class="space-y-2 text-sm text-content/70">
      <div class="flex items-center gap-2">
        <FireIcon class="h-4 w-4" />
        <span>热量 {{ recipe.nutrition.calories }} kcal</span>
      </div>
      <div class="flex flex-wrap gap-2 text-xs">
        <UiTag>蛋白质 {{ recipe.nutrition.protein }}g</UiTag>
        <UiTag>Omega-3 {{ recipe.nutrition.vitamins.omega3 }}g</UiTag>
        <UiTag>抗氧化 {{ recipe.nutrition.vitamins.antioxidants }}</UiTag>
      </div>
    </div>

    <button class="primary-button" type="button" @click="$emit('view-detail', recipe.id)">
      查看菜谱详情
    </button>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { FireIcon } from "@heroicons/vue/24/outline";

import UiCard from "@/components/atoms/UiCard.vue";
import UiTag from "@/components/atoms/UiTag.vue";
import type { Recipe } from "@/stores/recipes";

const props = defineProps<{ recipe: Recipe }>();

defineEmits<{
  (e: "toggle-bookmark", id: string): void;
  (e: "view-detail", id: string): void;
}>();

const totalTime = computed(() => props.recipe.prepTime + props.recipe.cookTime);

const difficultyLabel = computed(() => {
  const map: Record<string, string> = {
    easy: "简单",
    medium: "适中",
    hard: "进阶"
  };
  return map[props.recipe.difficulty] ?? props.recipe.difficulty;
});
</script>

<template>
  <UiCard class="space-y-4">
    <h3 class="text-lg font-semibold text-content">营养速览</h3>
    <div class="grid grid-cols-2 gap-3 text-sm text-content/70">
      <div class="rounded-2xl border border-outline/30 bg-surface-muted/60 p-4">
        <p class="text-xs text-content/60">热量</p>
        <p class="text-xl font-semibold text-accent">{{ data.calories }} kcal</p>
      </div>
      <div class="rounded-2xl border border-outline/30 bg-surface-muted/60 p-4">
        <p class="text-xs text-content/60">蛋白质</p>
        <p class="text-xl font-semibold text-content">{{ data.protein }} g</p>
      </div>
      <div class="rounded-2xl border border-outline/30 bg-surface-muted/60 p-4">
        <p class="text-xs text-content/60">脂肪</p>
        <p class="text-xl font-semibold text-content">{{ data.fat }} g</p>
      </div>
      <div class="rounded-2xl border border-outline/30 bg-surface-muted/60 p-4">
        <p class="text-xs text-content/60">碳水化合物</p>
        <p class="text-xl font-semibold text-content">{{ data.carbs }} g</p>
      </div>
    </div>

    <div class="space-y-3">
      <UiProgress label="维生素 B12" :value="vitaminScore(data.vitamins.b12, 1)" />
      <UiProgress label="维生素 E" :value="vitaminScore(data.vitamins.e, 5)" />
      <UiProgress label="Omega-3" :value="vitaminScore(data.vitamins.omega3, 2)" />
      <UiProgress label="抗氧化指数" :value="vitaminScore(data.vitamins.antioxidants, 500)" />
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import UiCard from "@/components/atoms/UiCard.vue";
import UiProgress from "@/components/atoms/UiProgress.vue";
import type { NutritionMacro } from "@/stores/recipes";

defineProps<{ data: NutritionMacro }>();

function vitaminScore(value: number, baseline: number) {
  return Math.min(100, Math.round((value / baseline) * 100));
}
</script>

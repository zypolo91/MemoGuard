<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <RecipeCard
      v-for="recipe in recipes"
      :key="recipe.id"
      :recipe="recipe"
      @toggle-bookmark="$emit('toggle-bookmark', $event)"
      @view-detail="$emit('view-detail', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import RecipeCard from "./RecipeCard.vue";
import type { Recipe } from "@/stores/recipes";

defineProps<{ recipes: Recipe[] }>();

defineEmits<{
  (e: "toggle-bookmark", id: string): void;
  (e: "view-detail", id: string): void;
}>();
</script>

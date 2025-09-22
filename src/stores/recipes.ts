import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";

import { listRecipes } from "@/services/mockApi/recipes";
import { loadState, saveState } from "@/utils/storage";

export interface NutritionMacro {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  vitamins: {
    b12: number;
    e: number;
    omega3: number;
    antioxidants: number;
  };
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  tags: string[];
  prepTime: number;
  cookTime: number;
  difficulty: "easy" | "medium" | "hard";
  heroImage: string;
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  steps: string[];
  nutrition: NutritionMacro;
  pairings: string[];
  isBookmarked: boolean;
}

interface RecipeDraft {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
}

const STORAGE_KEY = "recipes";

export const useRecipesStore = defineStore("recipes", () => {
  const recipes = ref<Recipe[]>(loadState<Recipe[]>(STORAGE_KEY, []));
  const state = ref<"idle" | "loading" | "success" | "error">(recipes.value.length ? "success" : "idle");
  const error = ref<string | null>(null);

  const bookmarked = computed(() => recipes.value.filter((recipe) => recipe.isBookmarked));
  const quickMeals = computed(() => recipes.value.filter((recipe) => recipe.prepTime + recipe.cookTime <= 20));
  const recommendations = computed(() =>
    recipes.value.slice(0, 3).map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      caption: `${recipe.prepTime + recipe.cookTime} 分钟 · ${recipe.tags[0] ?? '日常'}`,
      tag: recipe.tags[1] ?? "营养"
    }))
  );

  async function fetchRecipes() {
    state.value = "loading";
    error.value = null;
    try {
      recipes.value = await listRecipes();
      state.value = "success";
    } catch (err) {
      if (recipes.value.length) {
        state.value = "success";
        error.value = null;
        return;
      }
      state.value = "error";
      error.value = err instanceof Error ? err.message : "加载失败";
    }
  }

  function toggleBookmark(id: string) {
    recipes.value = recipes.value.map((recipe) =>
      recipe.id === id ? { ...recipe, isBookmarked: !recipe.isBookmarked } : recipe
    );
  }

  function addRecipe(draft: RecipeDraft) {
    const now = Date.now();
    const newRecipe: Recipe = {
      id: `r-${now}`,
      title: draft.title,
      description: draft.description,
      tags: ["自定义", "日常"],
      prepTime: draft.prepTime,
      cookTime: draft.cookTime,
      difficulty: "easy",
      heroImage: "/media/placeholder.jpg",
      ingredients: [],
      steps: [],
      nutrition: {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        vitamins: {
          b12: 0,
          e: 0,
          omega3: 0,
          antioxidants: 0
        }
      },
      pairings: [],
      isBookmarked: false
    };
    recipes.value = [newRecipe, ...recipes.value];
  }

  watch(
    recipes,
    (value) => saveState(STORAGE_KEY, value),
    { deep: true }
  );

  return {
    recipes,
    state,
    error,
    bookmarked,
    quickMeals,
    recommendations,
    fetchRecipes,
    toggleBookmark,
    addRecipe
  };
});

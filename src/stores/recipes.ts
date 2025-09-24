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

export type DifficultyLevel = "easy" | "medium" | "hard";

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  note?: string;
}

export interface RecipeStep {
  id: string;
  description: string;
  media?: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  tags: string[];
  prepTime: number;
  cookTime: number;
  difficulty: DifficultyLevel;
  heroImage: string;
  gallery?: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: NutritionMacro | null;
  pairings: string[];
  isBookmarked: boolean;
}

export interface RecipePayload {
  title: string;
  description: string;
  tags: string[];
  prepTime: number;
  cookTime: number;
  difficulty: DifficultyLevel;
  heroImage: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: NutritionMacro | null;
  pairings: string[];
  isBookmarked?: boolean;
}

const STORAGE_KEY = "recipes";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeIngredient(raw: any, index: number): RecipeIngredient {
  return {
    id: typeof raw?.id === "string" && raw.id.length ? raw.id : `ing-${index}`,
    name: String(raw?.name ?? "").trim(),
    quantity: typeof raw?.quantity === "number" ? raw.quantity : Number(raw?.quantity ?? 0),
    unit: String(raw?.unit ?? "").trim(),
    note: raw?.note ? String(raw.note).trim() : undefined
  };
}

function normalizeStep(raw: any, index: number): RecipeStep {
  if (typeof raw === "string") {
    return {
      id: `step-${index}`,
      description: raw
    };
  }
  return {
    id: typeof raw?.id === "string" && raw.id.length ? raw.id : `step-${index}`,
    description: String(raw?.description ?? raw?.text ?? "").trim(),
    media: raw?.media ?? null
  };
}

function ensureNutrition(raw: any): NutritionMacro | null {
  if (!raw) return null;
  const vitamins = raw.vitamins ?? {};
  return {
    calories: Number(raw.calories ?? 0),
    protein: Number(raw.protein ?? 0),
    fat: Number(raw.fat ?? 0),
    carbs: Number(raw.carbs ?? 0),
    vitamins: {
      b12: Number(vitamins.b12 ?? 0),
      e: Number(vitamins.e ?? 0),
      omega3: Number(vitamins.omega3 ?? 0),
      antioxidants: Number(vitamins.antioxidants ?? 0)
    }
  };
}

function normalizeRecipe(input: any): Recipe {
  const prepTime = Number(input?.prepTime ?? 0);
  const cookTime = Number(input?.cookTime ?? 0);
  return {
    id: typeof input?.id === "string" && input.id.length ? input.id : uid("r"),
    title: String(input?.title ?? "").trim(),
    description: String(input?.description ?? "").trim(),
    tags: Array.isArray(input?.tags) ? input.tags.map((tag: any) => String(tag ?? "").trim()).filter(Boolean) : [],
    prepTime: Number.isFinite(prepTime) ? prepTime : 0,
    cookTime: Number.isFinite(cookTime) ? cookTime : 0,
    difficulty: ((): DifficultyLevel => {
      const value = String(input?.difficulty ?? "easy").toLowerCase();
      if (value === "medium" || value === "hard") return value;
      return "easy";
    })(),
    heroImage: String(input?.heroImage ?? "").trim(),
    gallery: Array.isArray(input?.gallery)
      ? input.gallery.map((url: any) => String(url ?? "").trim()).filter(Boolean)
      : undefined,
    ingredients: Array.isArray(input?.ingredients)
      ? input.ingredients.map((ingredient: any, index: number) => normalizeIngredient(ingredient, index))
      : [],
    steps: Array.isArray(input?.steps)
      ? input.steps.map((step: any, index: number) => normalizeStep(step, index))
      : [],
    nutrition: ensureNutrition(input?.nutrition),
    pairings: Array.isArray(input?.pairings)
      ? input.pairings.map((item: any) => String(item ?? "").trim()).filter(Boolean)
      : [],
    isBookmarked: Boolean(input?.isBookmarked)
  };
}

function createRecipe(payload: RecipePayload): Recipe {
  const seed = normalizeRecipe({
    id: uid("r"),
    ...payload,
    isBookmarked: payload.isBookmarked ?? false
  });
  // Ensure generated ids for new entries are unique
  const withIds: Recipe = {
    ...seed,
    ingredients: seed.ingredients.map((ingredient, index) => ({
      ...ingredient,
      id: ingredient.id || uid(`ing-${index}`)
    })),
    steps: seed.steps.map((step, index) => ({
      ...step,
      id: step.id || uid(`step-${index}`)
    }))
  };
  return withIds;
}

export const useRecipesStore = defineStore("recipes", () => {
  const stored = loadState<Recipe[]>(STORAGE_KEY, []);
  const recipes = ref<Recipe[]>(Array.isArray(stored) ? stored.map(normalizeRecipe) : []);
  const state = ref<"idle" | "loading" | "success" | "error">(recipes.value.length ? "success" : "idle");
  const error = ref<string | null>(null);

  const bookmarked = computed(() => recipes.value.filter((recipe) => recipe.isBookmarked));
  const quickMeals = computed(() => recipes.value.filter((recipe) => recipe.prepTime + recipe.cookTime <= 20));
  const recommendations = computed(() => recipes.value.slice(0, 3));

  async function fetchRecipes() {
    state.value = "loading";
    error.value = null;
    try {
      const data = await listRecipes();
      recipes.value = (Array.isArray(data) ? data : []).map(normalizeRecipe);
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

  function addRecipe(payload: RecipePayload) {
    const recipe = createRecipe(payload);
    recipes.value = [recipe, ...recipes.value];
    return recipe.id;
  }

  function updateRecipe(id: string, payload: Partial<RecipePayload>) {
    recipes.value = recipes.value.map((recipe) => {
      if (recipe.id !== id) return recipe;
      const merged = {
        ...recipe,
        ...payload,
        tags: payload.tags ?? recipe.tags,
        ingredients: payload.ingredients ?? recipe.ingredients,
        steps: payload.steps ?? recipe.steps,
        nutrition: payload.nutrition ?? recipe.nutrition,
        pairings: payload.pairings ?? recipe.pairings,
        isBookmarked: payload.isBookmarked ?? recipe.isBookmarked
      };
      return normalizeRecipe({ ...merged, id });
    });
  }

  function removeRecipe(id: string) {
    recipes.value = recipes.value.filter((recipe) => recipe.id !== id);
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
    addRecipe,
    updateRecipe,
    removeRecipe
  };
});

<template>
  <section class="space-y-6 py-6">
    <PageHeader
      eyebrow="Mindful Nutrition"
      title="正念饮食"
      description="根据时段与偏好展示更合适的养脑菜谱。"
    />

    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        class="rounded-full border px-4 py-2 text-xs font-medium transition"
        :class="activeFilter === option.value ? 'border-primary bg-primary/10 text-primary' : 'border-outline/40 bg-surface-muted/60 text-content/60 hover:text-primary'"
        @click="setFilter(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="!visibleRecipes.length" class="rounded-3xl bg-surface-muted/60 px-6 py-10 text-center text-sm text-content/60">
      还没有符合条件的菜谱，试试切换分类或点击右下角新增吧。
    </div>

    <div v-else class="space-y-4">
      <UiCard
        v-for="recipe in visibleRecipes"
        :key="recipe.id"
        padding="p-5"
        class="space-y-4"
      >
        <div class="flex gap-4">
          <div v-if="recipe.heroImage" class="hidden h-24 w-24 overflow-hidden rounded-2xl bg-surface-muted sm:block">
            <img :src="recipe.heroImage" alt="" class="h-full w-full object-cover" />
          </div>
          <div class="flex-1 space-y-2">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs text-content/60">{{ totalTime(recipe) }} 分钟 · {{ difficultyMap[recipe.difficulty] }}</p>
                <h3 class="mt-1 text-base font-semibold text-content">{{ recipe.title }}</h3>
              </div>
              <button type="button" class="text-xs text-primary underline-offset-2 hover:underline" @click="toggleBookmark(recipe.id)">
                {{ recipe.isBookmarked ? '取消收藏' : '收藏' }}
              </button>
            </div>
            <p class="text-sm text-content/70">{{ recipe.description }}</p>
            <div class="flex flex-wrap gap-2 text-xs text-content/60">
              <span v-for="tag in recipe.tags" :key="tag" class="rounded-full bg-primary/10 px-3 py-1 text-primary">#{{ tag }}</span>
            </div>
            <div class="flex flex-wrap gap-2 text-xs text-content/60">
              <span class="rounded-full bg-surface-muted px-3 py-1">蛋白质 {{ recipe.nutrition?.protein ?? '--' }} g</span>
              <span class="rounded-full bg-surface-muted px-3 py-1">热量 {{ recipe.nutrition?.calories ?? '--' }} kcal</span>
            </div>
            <div class="flex items-center gap-3">
              <button type="button" class="text-xs text-primary underline-offset-2 hover:underline" @click="toggleExpanded(recipe.id)">
                {{ expandedId === recipe.id ? '收起详情' : '查看详情' }}
              </button>
            </div>
          </div>
        </div>
        <transition name="fade">
          <div v-if="expandedId === recipe.id" class="space-y-3 rounded-2xl bg-surface-muted/60 px-4 py-4 text-sm text-content/70">
            <div class="flex flex-wrap gap-2">
              <span v-for="pairing in recipe.pairings" :key="pairing" class="rounded-full bg-surface px-3 py-1 text-xs text-content/60">适合搭配：{{ pairing }}</span>
            </div>
            <NutritionFacts v-if="recipe.nutrition" :data="recipe.nutrition" />
            <p v-else class="text-xs text-content/60">当前菜谱暂无详细营养信息，可稍后补充。</p>
          </div>
        </transition>
      </UiCard>
    </div>

    <RecipeComposerSheet :open="isComposerOpen" @close="toggleComposer(false)" @submit="handleCreate" />
    <UiFab @click="toggleComposer(true)">
      <PlusIcon class="h-6 w-6" />
    </UiFab>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { PlusIcon } from "@heroicons/vue/24/outline";

import UiCard from "@/components/atoms/UiCard.vue";
import UiFab from "@/components/atoms/UiFab.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import NutritionFacts from "@/modules/diet/components/NutritionFacts.vue";
import RecipeComposerSheet from "@/modules/diet/components/RecipeComposerSheet.vue";
import { useRecipesStore } from "@/stores/recipes";
import type { Recipe } from "@/stores/recipes";

type FilterValue = "recommend" | "quick" | "bookmark" | "all";

const store = useRecipesStore();

const activeFilter = ref<FilterValue>("recommend");
const expandedId = ref<string | null>(null);
const isComposerOpen = ref(false);

const filterOptions: Array<{ label: string; value: FilterValue }> = [
  { label: "推荐", value: "recommend" },
  { label: "快捷", value: "quick" },
  { label: "收藏", value: "bookmark" },
  { label: "全部", value: "all" }
];

onMounted(() => {
  if (store.state === "idle") {
    store.fetchRecipes();
  }
});

const recipes = computed(() => store.recipes);
const bookmarked = computed(() => store.bookmarked);
const quickMeals = computed(() => store.quickMeals);
const recommendations = computed(() => store.recommendations);

const visibleRecipes = computed<Recipe[]>(() => {
  switch (activeFilter.value) {
    case "bookmark":
      return bookmarked.value;
    case "quick":
      return quickMeals.value;
    case "recommend":
      return recommendations.value.length ? recommendations.value : recipes.value;
    default:
      return recipes.value;
  }
});

watch(visibleRecipes, (list) => {
  if (!list.find((item) => item.id === expandedId.value)) {
    expandedId.value = null;
  }
});

const difficultyMap: Record<string, string> = {
  easy: "轻松",
  medium: "适中",
  hard: "进阶"
};

function totalTime(recipe: Recipe): number {
  return (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
}

function setFilter(value: FilterValue) {
  activeFilter.value = value;
}

function toggleExpanded(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
}

function toggleBookmark(id: string) {
  store.toggleBookmark(id);
}

function handleCreate(payload: { title: string; description: string; prepTime: number; cookTime: number }) {
  store.addRecipe(payload);
}

function toggleComposer(open: boolean) {
  isComposerOpen.value = open;
}
</script>

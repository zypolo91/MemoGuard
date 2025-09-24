<template>
  <section class="space-y-6 py-6">
    <PageHeader
      eyebrow="Mindful Nutrition"
      title="滋养饮食"
      description="精选家常菜谱与营养指南，搭配智能提醒守护日常饮食。"
    />

        <Transition name="fade">
      <div v-if="deleteTargetId" class="fixed inset-0 z-[95] flex items-center justify-center bg-black/50">
        <div class="w-full max-w-sm rounded-3xl bg-surface px-6 py-6 text-sm text-content shadow-xl">
          <h3 class="text-base font-semibold">确认删除？</h3>
          <p class="mt-2 text-xs text-content/60">删除后无法恢复，相关记录也会同步移除。</p>
          <div class="mt-5 flex items-center gap-3">
            <button type="button" class="flex-1 rounded-full border border-outline/40 px-4 py-2 text-xs text-content/60" @click="cancelDelete">
              取消
            </button>
            <button type="button" class="flex-1 rounded-full bg-danger px-4 py-2 text-xs font-medium text-white" @click="confirmDelete">
              确认删除
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        class="rounded-full border px-4 py-2 text-xs font-medium transition"
        :class="
          activeFilter === option.value
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-outline/40 bg-surface-muted/60 text-content/60 hover:text-primary'
        "
        @click="setFilter(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="!visibleRecipes.length" class="rounded-3xl bg-surface-muted/60 px-6 py-10 text-center text-sm text-content/60">
      暂无符合条件的菜谱，试着调整筛选或新增一条记录吧。
    </div>

    <div v-else class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="recipe in visibleRecipes"
        :key="recipe.id"
        class="group relative flex cursor-pointer flex-col overflow-hidden rounded-[28px] border border-outline/10 bg-surface shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-2xl"
        @click="openDetail(recipe.id)"
      >
        <div class="relative h-44 w-full overflow-hidden bg-surface-muted">
          <img v-if="recipe.heroImage" :src="recipe.heroImage" alt="" class="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          <div v-else class="flex h-full w-full items-center justify-center text-xs text-content/40">暂无封面</div>
          <div class="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <span class="rounded-full bg-black/40 px-3 py-1 text-xs text-white">
              共 {{ totalTime(recipe) }} 分钟 · {{ difficultyMap[recipe.difficulty] }}
            </span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
                :aria-pressed="recipe.isBookmarked"
                @click.stop="toggleBookmark(recipe.id)"
              >
                <component :is="recipe.isBookmarked ? BookmarkSolidIcon : BookmarkIcon" class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
                @click.stop="editRecipe(recipe.id)"
              >
                <PencilSquareIcon class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="rounded-full bg-black/40 p-2 text-white transition hover:bg-danger/80"
                @click.stop="requestDelete(recipe.id)"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div class="flex flex-1 flex-col gap-3 px-5 py-5">
          <div class="space-y-1">
            <h3 class="text-base font-semibold text-content">{{ recipe.title }}</h3>
            <p class="line-clamp-2 text-sm leading-relaxed text-content/70">{{ recipe.description }}</p>
          </div>
          <div class="flex flex-wrap gap-2 text-[11px] text-content/50">
            <span v-for="tag in recipe.tags" :key="tag" class="rounded-full bg-primary/10 px-3 py-1 text-primary">#{{ tag }}</span>
          </div>
          <div class="mt-auto flex flex-wrap gap-2 text-[11px] text-content/60">
            <span class="rounded-full bg-surface-muted px-3 py-1">蛋白质 {{ recipe.nutrition?.protein ?? '--' }} g</span>
            <span class="rounded-full bg-surface-muted px-3 py-1">热量 {{ recipe.nutrition?.calories ?? '--' }} kcal</span>
          </div>
        </div>
      </article>
    </div>

    <RecipeWorkspaceSheet
      :open="workspace.open"
      :recipe="activeRecipe"
      :mode="workspace.mode"
      @close="closeWorkspace"
      @submit="handleWorkspaceSubmit"
      @delete="confirmDeleteFromWorkspace"
      @toggleBookmark="toggleBookmark"
      @changeMode="handleWorkspaceModeChange"
    />

    <Transition name="fade">
      <div v-if="deleteTargetId" class="fixed inset-0 z-[95] flex items-center justify-center bg-black/50">
        <div class="w-full max-w-sm rounded-3xl bg-surface px-6 py-6 text-sm text-content shadow-xl">
          <h3 class="text-base font-semibold">确认删除？</h3>
          <p class="mt-2 text-xs text-content/60">删除后无法恢复，相关记录也会同步移除。</p>
          <div class="mt-5 flex items-center gap-3">
            <button type="button" class="flex-1 rounded-full border border-outline/40 px-4 py-2 text-xs text-content/60" @click="cancelDelete">
              取消
            </button>
            <button type="button" class="flex-1 rounded-full bg-danger px-4 py-2 text-xs font-medium text-white" @click="confirmDelete">
              确认删除
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <UiFab @click="createRecipe">
      <PlusIcon class="h-6 w-6" />
    </UiFab>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { BookmarkIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/vue/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/vue/24/solid";

import UiFab from "@/components/atoms/UiFab.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import RecipeWorkspaceSheet from "@/modules/diet/components/RecipeWorkspaceSheet.vue";
import { useRecipesStore } from "@/stores/recipes";
import type { Recipe, RecipePayload } from "@/stores/recipes";

type FilterValue = "recommend" | "quick" | "bookmark" | "all";
type FeedbackTone = "success" | "info" | "warning";

type WorkspaceMode = "view" | "edit" | "create";

const store = useRecipesStore();

const activeFilter = ref<FilterValue>("recommend");
const workspace = reactive<{ open: boolean; mode: WorkspaceMode; recipeId: string | null }>({ open: false, mode: "view", recipeId: null });
const deleteTargetId = ref<string | null>(null);
const feedback = reactive<{ visible: boolean; message: string; tone: FeedbackTone }>({ visible: false, message: "", tone: "success" });

const filterOptions: Array<{ label: string; value: FilterValue }> = [
  { label: "推荐", value: "recommend" },
  { label: "快速", value: "quick" },
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

const activeRecipe = computed(() => (workspace.recipeId ? recipes.value.find((item) => item.id === workspace.recipeId) ?? null : null));

watch(recipes, (list) => {
  if (workspace.recipeId && !list.some((recipe) => recipe.id === workspace.recipeId)) {
    workspace.recipeId = null;
    workspace.mode = "view";
  }
  if (deleteTargetId.value && !list.some((recipe) => recipe.id === deleteTargetId.value)) {
    deleteTargetId.value = null;
  }
});

const difficultyMap: Record<string, string> = {
  easy: "轻松",
  medium: "适中",
  hard: "挑战"
};

function totalTime(recipe: Recipe): number {
  return (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
}

function setFilter(value: FilterValue) {
  activeFilter.value = value;
}

function openDetail(id: string) {
  workspace.recipeId = id;
  workspace.mode = "view";
  workspace.open = true;
}

function createRecipe() {
  workspace.recipeId = null;
  workspace.mode = "create";
  workspace.open = true;
}

function editRecipe(id: string) {
  workspace.recipeId = id;
  workspace.mode = "edit";
  workspace.open = true;
}

function closeWorkspace() {
  workspace.open = false;
  workspace.mode = "view";
  workspace.recipeId = null;
}

function toggleBookmark(id: string) {
  store.toggleBookmark(id);
  showFeedback("收藏状态已更新", "info");
}

function requestDelete(id: string) {
  deleteTargetId.value = id;
}

function confirmDeleteFromWorkspace(id: string) {
  deleteTargetId.value = id;
}

function cancelDelete() {
  deleteTargetId.value = null;
}

function confirmDelete() {
  if (!deleteTargetId.value) return;
  store.removeRecipe(deleteTargetId.value);
  if (workspace.recipeId === deleteTargetId.value) {
    closeWorkspace();
  }
  showFeedback("菜谱已删除", "warning");
  deleteTargetId.value = null;
}

function handleWorkspaceSubmit(payload: { id?: string; data: RecipePayload }) {
  const { id, data } = payload;
  if (id) {
    store.updateRecipe(id, data);
    workspace.recipeId = id;
    workspace.mode = "view";
    showFeedback("菜谱已更新", "success");
  } else {
    const newId = store.addRecipe(data);
    workspace.recipeId = newId;
    workspace.mode = "view";
    showFeedback("菜谱已创建", "success");
  }
  workspace.open = true;
}

function handleWorkspaceModeChange(mode: "view" | "edit") {
  if (workspace.mode !== "create") {
    workspace.mode = mode;
  }
}

function showFeedback(message: string, tone: FeedbackTone) {
  feedback.message = message;
  feedback.tone = tone;
  feedback.visible = true;
  window.setTimeout(() => {
    feedback.visible = false;
  }, 2600);
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

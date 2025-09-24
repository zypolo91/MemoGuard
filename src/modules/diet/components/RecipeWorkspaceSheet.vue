<template>
  <Transition name="sheet">
    <div
      v-if="open"
      class="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-8 sm:px-8"
      @keydown.esc.prevent.stop="emitClose"
    >
      <div class="relative flex max-h-[92vh] w-full max-w-[760px] flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl">
        <header class="flex items-center justify-between border-b border-outline/30 bg-surface px-6 py-5">
          <div class="space-y-1">
            <p v-if="hasRecipe" class="text-xs uppercase tracking-[0.3em] text-primary/70">Nutrition</p>
            <h2 class="text-lg font-semibold text-content">{{ headerTitle }}</h2>
            <p class="text-xs text-content/60">{{ subTitle }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="hasRecipe"
              type="button"
              class="rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
              :aria-pressed="recipe?.isBookmarked"
              @click.stop="handleToggleBookmark"
            >
              <component :is="recipe?.isBookmarked ? BookmarkSolidIcon : BookmarkIcon" class="h-5 w-5" />
            </button>
            <UiIconButton
              v-if="hasRecipe && !isEditing"
              aria-label="编辑"
              class="hidden sm:inline-flex"
              @click="requestEditMode"
            >
              <PencilSquareIcon class="h-5 w-5" />
            </UiIconButton>
            <UiIconButton
              v-if="hasRecipe && !isEditing"
              aria-label="删除"
              class="hidden border-danger/30 text-danger hover:border-danger/60 hover:text-danger sm:inline-flex"
              @click="requestDelete"
            >
              <TrashIcon class="h-5 w-5" />
            </UiIconButton>
            <UiIconButton aria-label="关闭" @click="emitClose">
              <XMarkIcon class="h-5 w-5" />
            </UiIconButton>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto px-6 pb-6 pt-5">
          <div
            v-if="errorMessage"
            class="mb-4 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger"
          >
            {{ errorMessage }}
          </div>

          <template v-if="isEditing">
            <form class="space-y-6 pb-28" @submit.prevent="handleSubmit">
              <section class="space-y-3">
                <label class="block text-sm font-medium text-content">封面 *</label>
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div class="relative h-40 w-full overflow-hidden rounded-3xl bg-surface-muted sm:h-36 sm:w-48">
                    <img v-if="form.heroImage" :src="form.heroImage" alt="" class="h-full w-full object-cover" />
                    <div v-else class="grid h-full w-full place-items-center text-xs text-content/40">上传一张成品图</div>
                    <button
                      v-if="form.heroImage"
                      type="button"
                      class="absolute top-3 right-3 rounded-full bg-black/40 px-3 py-1 text-xs text-white hover:bg-black/60"
                      @click="clearHeroImage"
                    >
                      移除
                    </button>
                    <input ref="heroInput" type="file" accept="image/*" class="hidden" @change="onHeroFile" />
                  </div>
                  <div class="flex flex-1 flex-col gap-3 text-xs text-content/60">
                    <button
                      type="button"
                      class="w-full rounded-full border border-dashed border-outline/40 px-4 py-2 text-sm font-medium text-primary transition hover:border-primary"
                      @click="triggerHero"
                    >
                      选择图片
                    </button>
                    <p>推荐 1280×720 以上的清晰图片，支持 JPG / PNG / WEBP，最大 2MB。</p>
                  </div>
                </div>
              </section>

              <section class="mt-6 grid gap-4 sm:grid-cols-2">
                <div class="space-y-2">
                  <label class="text-sm font-medium text-content">菜谱名称 *</label>
                  <input
                    v-model.trim="form.title"
                    type="text"
                    required
                    placeholder="例如：银杏核桃燕麦碗"
                    class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-sm text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium text-content">难度</label>
                  <select
                    v-model="form.difficulty"
                    class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-sm text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="easy">简单</option>
                    <option value="medium">适中</option>
                    <option value="hard">挑战</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium text-content">准备时间（分钟）</label>
                  <input
                    v-model.number="form.prepTime"
                    type="number"
                    min="0"
                    class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-sm text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium text-content">烹饪时间（分钟）</label>
                  <input
                    v-model.number="form.cookTime"
                    type="number"
                    min="0"
                    class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-sm text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </section>

              <section class="mt-6 space-y-2">
                <label class="text-sm font-medium text-content">菜谱亮点</label>
                <textarea
                  v-model="form.description"
                  rows="4"
                  placeholder="可描述营养亮点或口味特色"
                  class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-sm leading-relaxed text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </section>

              <section class="mt-6 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <h3 class="text-sm font-semibold text-content">标签</h3>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="tagInput"
                      type="text"
                      placeholder="输入标签后回车"
                      class="w-40 rounded-full border border-dashed border-outline/40 bg-transparent px-4 py-2 text-xs text-content focus:border-primary focus:outline-none"
                      @keydown.enter.prevent="handleAddTag"
                    />
                    <button type="button" class="text-xs text-primary" @click="handleAddTag">添加</button>
                  </div>
                </div>
                <div class="flex flex-wrap gap-2 text-xs text-primary">
                  <span v-for="tag in form.tags" :key="tag" class="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
                    #{{ tag }}
                    <button type="button" class="text-primary/60" @click="removeTag(tag)">×</button>
                  </span>
                </div>
              </section>

              <section class="mt-6 space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-content">食材</h3>
                  <button type="button" class="text-xs text-primary" @click="addIngredient">新增食材</button>
                </div>
                <div class="space-y-3">
                  <div
                    v-for="ingredient in form.ingredients"
                    :key="ingredient.id"
                    class="grid grid-cols-[1fr_auto_auto_auto] gap-2 rounded-3xl border border-outline/30 bg-surface-muted/60 px-4 py-3 text-xs text-content"
                  >
                    <input
                      v-model.trim="ingredient.name"
                      type="text"
                      placeholder="食材"
                      class="rounded-2xl border border-outline/30 bg-surface px-3 py-2 focus:border-primary focus:outline-none"
                    />
                    <input
                      v-model.trim="ingredient.quantity"
                      type="text"
                      placeholder="用量"
                      class="w-20 rounded-2xl border border-outline/30 bg-surface px-3 py-2 text-center focus:border-primary focus:outline-none"
                    />
                    <input
                      v-model.trim="ingredient.unit"
                      type="text"
                      placeholder="单位"
                      class="w-20 rounded-2xl border border-outline/30 bg-surface px-3 py-2 text-center focus:border-primary focus:outline-none"
                    />
                    <button type="button" class="text-danger" @click="removeIngredient(ingredient.id)">删除</button>
                    <input
                      v-model.trim="ingredient.note"
                      type="text"
                      placeholder="备注（可选）"
                      class="col-span-4 mt-2 rounded-2xl border border-outline/20 bg-surface px-3 py-2 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </section>

              <section class="mt-6 space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-content">制作步骤</h3>
                  <button type="button" class="text-xs text-primary" @click="addStep">新增步骤</button>
                </div>
                <div class="space-y-3">
                  <div
                    v-for="(step, index) in form.steps"
                    :key="step.id"
                    class="space-y-2 rounded-3xl border border-outline/30 bg-surface-muted/60 px-4 py-3 text-sm text-content"
                  >
                    <div class="flex items-center justify-between text-xs text-content/60">
                      <span>步骤 {{ index + 1 }}</span>
                      <button type="button" class="text-danger" @click="removeStep(step.id)">删除</button>
                    </div>
                    <textarea
                      v-model="step.description"
                      rows="3"
                      placeholder="描述要点、火候或动作"
                      class="w-full rounded-2xl border border-outline/30 bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                    <div class="flex flex-wrap items-center gap-2 text-xs text-content/60">
                      <label class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-outline/30 px-3 py-2">
                        <input type="file" accept="image/*" class="hidden" @change="onStepFile(step.id, $event)" />
                        <span>添加图片</span>
                      </label>
                      <button
                        v-if="step.media"
                        type="button"
                        class="text-danger"
                        @click="clearStepMedia(step.id)"
                      >
                        移除图片
                      </button>
                    </div>
                    <img v-if="step.media" :src="step.media" alt="" class="max-h-48 w-full rounded-2xl object-cover" />
                  </div>
                </div>
              </section>

              <section class="mt-6 space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-content">搭配建议</h3>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="pairingInput"
                      type="text"
                      placeholder="输入搭配后回车"
                      class="w-48 rounded-full border border-dashed border-outline/40 bg-transparent px-4 py-2 text-xs text-content focus:border-primary focus:outline-none"
                      @keydown.enter.prevent="handleAddPairing"
                    />
                    <button type="button" class="text-xs text-primary" @click="handleAddPairing">添加</button>
                  </div>
                </div>
                <div class="flex flex-wrap gap-2 text-xs text-content/60">
                  <span
                    v-for="pairing in form.pairings"
                    :key="pairing"
                    class="flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1"
                  >
                    {{ pairing }}
                    <button type="button" class="text-content/40" @click="removePairing(pairing)">×</button>
                  </span>
                </div>
              </section>

              <section class="mt-6 space-y-3">
                <h3 class="text-sm font-semibold text-content">营养信息（可选）</h3>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="space-y-1 text-xs text-content/60">
                    热量 (kcal)
                    <input
                      v-model.number="form.nutrition.calories"
                      type="number"
                      min="0"
                      class="w-full rounded-2xl border border-outline/30 bg-surface px-3 py-2 focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label class="space-y-1 text-xs text-content/60">
                    蛋白质 (g)
                    <input
                      v-model.number="form.nutrition.protein"
                      type="number"
                      min="0"
                      class="w-full rounded-2xl border border-outline/30 bg-surface px-3 py-2 focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label class="space-y-1 text-xs text-content/60">
                    脂肪 (g)
                    <input
                      v-model.number="form.nutrition.fat"
                      type="number"
                      min="0"
                      class="w-full rounded-2xl border border-outline/30 bg-surface px-3 py-2 focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label class="space-y-1 text-xs text-content/60">
                    碳水 (g)
                    <input
                      v-model.number="form.nutrition.carbs"
                      type="number"
                      min="0"
                      class="w-full rounded-2xl border border-outline/30 bg-surface px-3 py-2 focus:border-primary focus:outline-none"
                    />
                  </label>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="space-y-1 text-xs text-content/60">
                    维生素 B12 (μg)
                    <input
                      v-model.number="form.nutrition.vitamins.b12"
                      type="number"
                      min="0"
                      class="w-full rounded-2xl border border-outline/30 bg-surface px-3 py-2 focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label class="space-y-1 text-xs text-content/60">
                    维生素 E (mg)
                    <input
                      v-model.number="form.nutrition.vitamins.e"
                      type="number"
                      min="0"
                      class="w-full rounded-2xl border border-outline/30 bg-surface px-3 py-2 focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label class="space-y-1 text-xs text-content/60">
                    Omega-3 (g)
                    <input
                      v-model.number="form.nutrition.vitamins.omega3"
                      type="number"
                      min="0"
                      class="w-full rounded-2xl border border-outline/30 bg-surface px-3 py-2 focus:border-primary focus:outline-none"
                    />
                  </label>
                </div>
              </section>

              <div class="sticky bottom-0 -mx-6 flex flex-wrap justify-end gap-3 border-t border-outline/20 bg-surface px-6 py-4">
                <button type="button" class="rounded-full border border-outline/40 px-4 py-2 text-sm text-content/70" @click="handleCancel">
                  取消
                </button>
                <button type="submit" class="primary-button px-6 py-2">
                  {{ submitLabel }}
                </button>
              </div>
            </form>
          </template>

          <template v-else>
            <div v-if="recipe" class="space-y-6 pb-6">
              <div class="overflow-hidden rounded-3xl bg-surface-muted">
                <img v-if="recipe.heroImage" :src="recipe.heroImage" alt="" class="h-48 w-full object-cover" />
                <div v-else class="flex h-48 items-center justify-center text-xs text-content/50">暂无封面图</div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2 text-xs text-content/60">
                <div class="rounded-2xl bg-surface-muted/70 px-4 py-3">
                  <p class="text-[11px] uppercase tracking-[0.3em] text-primary/70">总耗时</p>
                  <p class="mt-1 text-sm text-content">{{ totalDuration ? totalDuration + ' 分钟' : '--' }}</p>
                </div>
                <div class="rounded-2xl bg-surface-muted/70 px-4 py-3">
                  <p class="text-[11px] uppercase tracking-[0.3em] text-primary/70">难度</p>
                  <p class="mt-1 text-sm text-content">{{ difficultyText }}</p>
                </div>
              </div>

              <div class="rounded-3xl bg-surface-muted/40 px-5 py-4 text-sm text-content/80">
                <p class="whitespace-pre-line leading-relaxed">{{ recipe.description || '暂无描述' }}</p>
                <ul class="mt-3 flex flex-wrap gap-4 text-xs text-content/60">
                  <li>准备：{{ recipe.prepTime ?? 0 }} 分钟</li>
                  <li>烹饪：{{ recipe.cookTime ?? 0 }} 分钟</li>
                </ul>
              </div>

              <div v-if="recipe.tags.length" class="flex flex-wrap gap-2 text-xs text-primary">
                <span v-for="tag in recipe.tags" :key="tag" class="rounded-full bg-primary/10 px-3 py-1">#{{ tag }}</span>
              </div>

              <section class="space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-content">食材清单</h3>
                  <UiIconButton v-if="hasRecipe && !isEditing" class="sm:hidden" aria-label="编辑" @click="requestEditMode">
                    <PencilSquareIcon class="h-5 w-5" />
                  </UiIconButton>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="item in viewIngredients"
                    :key="item.id"
                    class="rounded-2xl border border-outline/20 bg-surface px-4 py-3 text-sm text-content"
                  >
                    <div class="flex items-center justify-between gap-4">
                      <span class="font-medium">{{ item.name }}</span>
                      <span class="text-xs text-content/60">{{ item.quantity ? item.quantity + ' ' + item.unit : item.unit }}</span>
                    </div>
                    <p v-if="item.note" class="mt-1 text-xs text-content/60">{{ item.note }}</p>
                  </div>
                </div>
              </section>

              <section class="space-y-3">
                <h3 class="text-sm font-semibold text-content">制作步骤</h3>
                <div class="space-y-4">
                  <article
                    v-for="(step, index) in viewSteps"
                    :key="step.id"
                    class="rounded-3xl border border-outline/20 bg-surface px-4 py-4 text-sm text-content"
                  >
                    <div class="flex items-center gap-2 text-xs text-primary">
                      <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {{ index + 1 }}
                      </span>
                      <span class="font-medium">步骤 {{ index + 1 }}</span>
                    </div>
                    <p class="mt-2 whitespace-pre-line leading-relaxed text-content/80">{{ step.description }}</p>
                    <img v-if="step.media" :src="step.media" alt="" class="mt-3 max-h-56 w-full rounded-2xl object-cover" />
                  </article>
                </div>
              </section>

              <section v-if="viewPairings.length" class="space-y-3">
                <h3 class="text-sm font-semibold text-content">搭配建议</h3>
                <div class="flex flex-wrap gap-2 text-xs text-content/60">
                  <span v-for="item in viewPairings" :key="item" class="rounded-full bg-surface-muted px-3 py-1">{{ item }}</span>
                </div>
              </section>

              <section v-if="hasNutritionData" class="space-y-3">
                <h3 class="text-sm font-semibold text-content">营养信息</h3>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div
                    v-for="item in viewNutritionItems"
                    :key="item.label"
                    class="rounded-2xl border border-outline/20 bg-surface px-4 py-3 text-sm text-content"
                  >
                    <p class="text-xs uppercase tracking-[0.2em] text-primary/70">{{ item.label }}</p>
                    <p class="mt-1 text-sm font-semibold">{{ item.value }}</p>
                  </div>
                </div>
              </section>

              <div class="flex gap-2 sm:hidden">
                <UiIconButton class="flex-1" aria-label="编辑" @click="requestEditMode">
                  <PencilSquareIcon class="h-5 w-5" />
                </UiIconButton>
                <UiIconButton
                  v-if="hasRecipe"
                  class="flex-1 border-danger/30 text-danger hover:border-danger/60 hover:text-danger"
                  aria-label="删除"
                  @click="requestDelete"
                >
                  <TrashIcon class="h-5 w-5" />
                </UiIconButton>
              </div>
            </div>

            <div v-else class="rounded-3xl bg-surface-muted/70 px-6 py-12 text-center text-sm text-content/60">
              暂无可展示的菜谱详情
            </div>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { BookmarkIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/vue/24/solid";

import UiIconButton from "@/components/atoms/UiIconButton.vue";
import type { DifficultyLevel, Recipe, RecipeIngredient, RecipePayload, RecipeStep } from "@/stores/recipes";

type WorkspaceMode = "view" | "edit" | "create";

interface IngredientForm {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  note: string;
}

interface StepForm {
  id: string;
  description: string;
  media: string | null;
}

interface NutritionForm {
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

interface RecipeFormState {
  title: string;
  description: string;
  heroImage: string;
  prepTime: number;
  cookTime: number;
  difficulty: DifficultyLevel;
  tags: string[];
  ingredients: IngredientForm[];
  steps: StepForm[];
  nutrition: NutritionForm;
  pairings: string[];
}

const props = defineProps<{
  open: boolean;
  recipe: Recipe | null;
  mode: WorkspaceMode;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", payload: { id?: string; data: RecipePayload }): void;
  (e: "delete", id: string): void;
  (e: "toggleBookmark", id: string): void;
  (e: "changeMode", mode: "view" | "edit"): void;
}>();

const heroInput = ref<HTMLInputElement | null>(null);
const pairingInput = ref("");
const tagInput = ref("");
const errorMessage = ref("");

const form = reactive<RecipeFormState>(createDefaultForm());

const hasRecipe = computed(() => Boolean(props.recipe));
const isEditing = computed(() => props.mode === "edit" || props.mode === "create");

const headerTitle = computed(() => {
  if (props.mode === "create") {
    return "创建养脑菜谱";
  }
  if (props.mode === "edit") {
    return props.recipe ? `编辑·${props.recipe.title}` : "编辑菜谱";
  }
  return props.recipe?.title ?? "养脑菜谱详情";
});

const subTitle = computed(() => {
  if (props.mode === "create") {
    return "记录新的家常做法，自定义营养亮点";
  }
  if (props.mode === "edit") {
    return "完善步骤、营养数据，保持菜谱最新";
  }
  return props.recipe?.description ?? "查看养脑菜谱的营养亮点与做法";
});

const submitLabel = computed(() => (props.mode === "edit" ? "保存修改" : "创建菜谱"));
const difficultyText = computed(() => {
  if (!props.recipe) return "简单";
  const map: Record<DifficultyLevel, string> = { easy: "简单", medium: "适中", hard: "挑战" };
  return map[props.recipe.difficulty] ?? "简单";
});
const totalDuration = computed(() => {
  if (!props.recipe) return null;
  const prep = props.recipe.prepTime ?? 0;
  const cook = props.recipe.cookTime ?? 0;
  const total = prep + cook;
  return total > 0 ? total : null;
});
const viewNutritionItems = computed(() => {
  const nutrition = props.recipe?.nutrition;
  if (!nutrition) return [] as Array<{ label: string; value: string }>;
  const items: Array<{ label: string; value: string }> = [];
  const push = (label: string, value: number | null | undefined, unit: string) => {
    if (value && value > 0) {
      items.push({ label, value: `${value} ${unit}` });
    }
  };
  push("热量", nutrition.calories, "kcal");
  push("蛋白质", nutrition.protein, "g");
  push("脂肪", nutrition.fat, "g");
  push("碳水", nutrition.carbs, "g");
  push("维生素 B12", nutrition.vitamins.b12, "μg");
  push("维生素 E", nutrition.vitamins.e, "mg");
  push("Omega-3", nutrition.vitamins.omega3, "g");
  if (nutrition.vitamins.antioxidants && nutrition.vitamins.antioxidants > 0) {
    items.push({ label: "抗氧化物", value: `${nutrition.vitamins.antioxidants} mg` });
  }
  return items;
});
const hasNutritionData = computed(() => viewNutritionItems.value.length > 0);
const viewIngredients = computed(() => props.recipe?.ingredients ?? []);
const viewSteps = computed(() => props.recipe?.steps ?? []);
const viewPairings = computed(() => props.recipe?.pairings ?? []);

watch(
  () => props.open,
  (open) => {
    if (open) {
      initializeForm();
    } else {
      resetEphemeralState();
    }
  }
);

watch(
  () => props.mode,
  (mode, previous) => {
    if (!props.open) return;
    if (mode === "create") {
      resetForm();
      return;
    }
    if (mode === "edit" && props.recipe) {
      hydrateForm(props.recipe);
    }
    if (mode === "view" && previous !== "view" && props.recipe) {
      hydrateForm(props.recipe);
    }
  }
);

watch(
  () => props.recipe,
  (recipe) => {
    if (!props.open || !recipe) return;
    if (props.mode === "edit" || props.mode === "view") {
      hydrateForm(recipe);
    }
  }
);

function initializeForm() {
  errorMessage.value = "";
  if (props.mode === "create") {
    resetForm();
    return;
  }
  if (props.recipe) {
    hydrateForm(props.recipe);
  } else {
    resetForm();
  }
}

function resetForm() {
  applyFormState(createDefaultForm());
}

function hydrateForm(recipe: Recipe) {
  const state = mapRecipeToForm(recipe);
  applyFormState(state);
}

function applyFormState(state: RecipeFormState) {
  form.title = state.title;
  form.description = state.description;
  form.heroImage = state.heroImage;
  form.prepTime = state.prepTime;
  form.cookTime = state.cookTime;
  form.difficulty = state.difficulty;
  form.tags.splice(0, form.tags.length, ...state.tags);
  form.pairings.splice(0, form.pairings.length, ...state.pairings);
  form.ingredients.splice(0, form.ingredients.length, ...state.ingredients.map(cloneIngredient));
  form.steps.splice(0, form.steps.length, ...state.steps.map(cloneStep));
  form.nutrition = cloneNutrition(state.nutrition);
}

function resetEphemeralState() {
  pairingInput.value = "";
  tagInput.value = "";
  errorMessage.value = "";
}

function cloneIngredient(input: IngredientForm): IngredientForm {
  return { ...input };
}

function cloneStep(input: StepForm): StepForm {
  return { ...input };
}

function cloneNutrition(input: NutritionForm): NutritionForm {
  return {
    calories: input.calories,
    protein: input.protein,
    fat: input.fat,
    carbs: input.carbs,
    vitamins: { ...input.vitamins }
  };
}

function createDefaultForm(): RecipeFormState {
  return {
    title: "",
    description: "",
    heroImage: "",
    prepTime: 5,
    cookTime: 10,
    difficulty: "easy",
    tags: [],
    ingredients: [createIngredient()],
    steps: [createStep()],
    nutrition: createDefaultNutrition(),
    pairings: []
  };
}

function createDefaultNutrition(): NutritionForm {
  return {
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
  };
}

function createIngredient(): IngredientForm {
  return {
    id: uid("ing"),
    name: "",
    quantity: "",
    unit: "",
    note: ""
  };
}

function createStep(): StepForm {
  return {
    id: uid("step"),
    description: "",
    media: null
  };
}

function mapRecipeToForm(recipe: Recipe): RecipeFormState {
  return {
    title: recipe.title,
    description: recipe.description,
    heroImage: recipe.heroImage ?? "",
    prepTime: recipe.prepTime ?? 0,
    cookTime: recipe.cookTime ?? 0,
    difficulty: recipe.difficulty ?? "easy",
    tags: [...recipe.tags],
    ingredients: recipe.ingredients.length
      ? recipe.ingredients.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity ? String(item.quantity) : "",
          unit: item.unit ?? "",
          note: item.note ?? ""
        }))
      : [createIngredient()],
    steps: recipe.steps.length
      ? recipe.steps.map((item) => ({
          id: item.id,
          description: item.description,
          media: item.media ?? null
        }))
      : [createStep()],
    nutrition: recipe.nutrition
      ? {
          calories: recipe.nutrition.calories ?? 0,
          protein: recipe.nutrition.protein ?? 0,
          fat: recipe.nutrition.fat ?? 0,
          carbs: recipe.nutrition.carbs ?? 0,
          vitamins: {
            b12: recipe.nutrition.vitamins.b12 ?? 0,
            e: recipe.nutrition.vitamins.e ?? 0,
            omega3: recipe.nutrition.vitamins.omega3 ?? 0,
            antioxidants: recipe.nutrition.vitamins.antioxidants ?? 0
          }
        }
      : createDefaultNutrition(),
    pairings: recipe.pairings.length ? [...recipe.pairings] : []
  };
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function emitClose() {
  emit("close");
}

function handleCancel() {
  if (props.mode === "edit" && hasRecipe.value) {
    emit("changeMode", "view");
    return;
  }
  emitClose();
}

function requestEditMode() {
  if (!hasRecipe.value) return;
  emit("changeMode", "edit");
}

async function onHeroFile(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target?.files?.length) return;
  const file = target.files[0];
  form.heroImage = await readFileAsDataUrl(file);
}

function triggerHero() {
  heroInput.value?.click();
}

function clearHeroImage() {
  form.heroImage = "";
  if (heroInput.value) {
    heroInput.value.value = "";
  }
}

async function onStepFile(stepId: string, event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target?.files?.length) return;
  const file = target.files[0];
  const step = form.steps.find((item) => item.id === stepId);
  if (!step) return;
  step.media = await readFileAsDataUrl(file);
}

function clearStepMedia(stepId: string) {
  const step = form.steps.find((item) => item.id === stepId);
  if (!step) return;
  step.media = null;
}

function addIngredient() {
  form.ingredients.push(createIngredient());
}

function removeIngredient(id: string) {
  if (form.ingredients.length === 1) {
    form.ingredients[0] = createIngredient();
    return;
  }
  form.ingredients = form.ingredients.filter((item) => item.id !== id);
}

function addStep() {
  form.steps.push(createStep());
}

function removeStep(id: string) {
  if (form.steps.length === 1) {
    form.steps[0] = createStep();
    return;
  }
  form.steps = form.steps.filter((item) => item.id !== id);
}

function handleAddTag() {
  const value = tagInput.value.trim();
  if (!value || form.tags.includes(value)) {
    tagInput.value = "";
    return;
  }
  form.tags.push(value);
  tagInput.value = "";
}

function removeTag(tag: string) {
  form.tags = form.tags.filter((item) => item !== tag);
}

function handleAddPairing() {
  const value = pairingInput.value.trim();
  if (!value || form.pairings.includes(value)) {
    pairingInput.value = "";
    return;
  }
  form.pairings.push(value);
  pairingInput.value = "";
}

function removePairing(value: string) {
  form.pairings = form.pairings.filter((item) => item !== value);
}

function requestDelete() {
  if (!props.recipe) return;
  emit("delete", props.recipe.id);
}

function handleToggleBookmark() {
  if (!props.recipe) return;
  emit("toggleBookmark", props.recipe.id);
}

function validateForm(): boolean {
  if (!form.title.trim()) {
    errorMessage.value = "请填写菜谱名称";
    return false;
  }
  const hasIngredient = form.ingredients.some((item) => item.name.trim());
  if (!hasIngredient) {
    errorMessage.value = "请至少添加一项食材";
    return false;
  }
  const hasStep = form.steps.some((item) => item.description.trim());
  if (!hasStep) {
    errorMessage.value = "请完善至少一个制作步骤";
    return false;
  }
  errorMessage.value = "";
  return true;
}

function ensureNutritionPayload(): NutritionForm | null {
  const values = [
    form.nutrition.calories,
    form.nutrition.protein,
    form.nutrition.fat,
    form.nutrition.carbs,
    form.nutrition.vitamins.b12,
    form.nutrition.vitamins.e,
    form.nutrition.vitamins.omega3,
    form.nutrition.vitamins.antioxidants
  ];
  const meaningful = values.some((value) => Number(value) > 0);
  return meaningful ? cloneNutrition(form.nutrition) : null;
}

function buildPayload(): RecipePayload {
  const nutrition = ensureNutritionPayload();
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    tags: [...form.tags],
    prepTime: form.prepTime ?? 0,
    cookTime: form.cookTime ?? 0,
    difficulty: form.difficulty,
    heroImage: form.heroImage,
    ingredients: form.ingredients
      .filter((item) => item.name.trim())
      .map<RecipeIngredient>((item) => ({
        id: item.id,
        name: item.name.trim(),
        quantity: Number(item.quantity) || 0,
        unit: item.unit.trim(),
        note: item.note.trim() || undefined
      })),
    steps: form.steps
      .filter((item) => item.description.trim())
      .map<RecipeStep>((item, index) => ({
        id: item.id || uid(`step-${index}`),
        description: item.description.trim(),
        media: item.media ?? undefined
      })),
    nutrition,
    pairings: [...form.pairings],
    isBookmarked: props.recipe?.isBookmarked ?? false
  };
}

function handleSubmit() {
  if (!validateForm()) return;
  const payload = buildPayload();
  const id = props.mode === "edit" && props.recipe ? props.recipe.id : undefined;
  emit("submit", { id, data: payload });
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
</script>


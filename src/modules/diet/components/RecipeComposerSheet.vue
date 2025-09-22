<template>
  <Transition name="sheet">
    <div v-if="open" class="fixed inset-0 z-[80] flex items-end bg-black/50">
      <div class="relative w-full max-h-[85vh] rounded-t-3xl bg-surface shadow-2xl">
        <header class="flex items-center justify-between border-b border-outline/30 px-6 py-5">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-content">新增养脑菜谱</h2>
            <p class="text-xs text-content/60">记录家常做法，为家人准备更安心的饮食。</p>
          </div>
          <UiIconButton aria-label="关闭" @click="emit('close')">
            <XMarkIcon class="h-5 w-5" />
          </UiIconButton>
        </header>

        <form class="flex max-h-[75vh] flex-col" @submit.prevent="handleSubmit">
          <div class="flex-1 overflow-y-auto px-6 pt-4 pb-6 space-y-6">
            <div class="space-y-3">
              <label class="block text-sm font-medium text-content">菜谱名称</label>
              <input
                v-model.trim="form.title"
                type="text"
                required
                placeholder="例如：银杏核桃燕麦碗"
                class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-base text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div class="space-y-2">
              <span class="text-sm font-medium text-content">简要描述</span>
              <textarea
                v-model="form.description"
                rows="4"
                placeholder="突出营养亮点或口感特色"
                class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-sm leading-relaxed text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm text-content/70">
              <label class="space-y-2">
                <span class="text-sm font-medium text-content">准备时间（分钟）</span>
                <input
                  v-model.number="form.prepTime"
                  type="number"
                  min="0"
                  class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <label class="space-y-2">
                <span class="text-sm font-medium text-content">烹饪时间（分钟）</span>
                <input
                  v-model.number="form.cookTime"
                  type="number"
                  min="0"
                  class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
            </div>

            <p class="text-xs text-content/50">保存后可继续补充详细做法与营养数据。</p>
          </div>

          <div class="flex flex-wrap items-center gap-3 border-t border-outline/30 bg-surface px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <button type="button" class="flex-1 rounded-full border border-outline/40 px-4 py-3 text-sm text-content/70" @click="emit('close')">
              取消
            </button>
            <button type="submit" class="primary-button flex-1 justify-center" :disabled="!form.title.trim()">
              保存菜谱
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";

import UiIconButton from "@/components/atoms/UiIconButton.vue";

interface RecipeDraft {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
}

const props = defineProps<{ open: boolean }>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", payload: RecipeDraft): void;
}>();

const form = reactive<RecipeDraft>({
  title: "",
  description: "",
  prepTime: 5,
  cookTime: 10
});

watch(
  () => props.open,
  (value) => {
    if (!value) {
      resetForm();
    }
  }
);

function resetForm() {
  form.title = "";
  form.description = "";
  form.prepTime = 5;
  form.cookTime = 10;
}

function handleSubmit() {
  emit("submit", { ...form });
  emit("close");
}
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: transform 0.24s ease, opacity 0.24s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(20%);
  opacity: 0;
}
</style>

<template>
  <Transition name="sheet">
    <div v-if="open" class="fixed inset-0 z-[80] flex items-end bg-black/50">
      <div class="relative w-full max-h-[85vh] rounded-t-3xl bg-surface shadow-2xl">
        <header class="flex items-center justify-between border-b border-outline/30 px-6 py-5">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-content">新增关怀任务</h2>
            <p class="text-xs text-content/60">安排提醒，让照护节奏更从容。</p>
          </div>
          <UiIconButton aria-label="关闭" @click="emit('close')">
            <XMarkIcon class="h-5 w-5" />
          </UiIconButton>
        </header>

        <form class="flex max-h-[75vh] flex-col" @submit.prevent="handleSubmit">
          <div class="flex-1 overflow-y-auto px-6 pt-4 pb-6 space-y-6">
            <div class="space-y-3">
              <label class="block text-sm font-medium text-content">任务标题</label>
              <input
                v-model.trim="form.title"
                type="text"
                required
                placeholder="例如：上午服用胆碱片"
                class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-base text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div class="grid gap-3 text-sm text-content/70 sm:grid-cols-2">
              <label class="space-y-2">
                <span class="text-sm font-medium text-content">开始日期</span>
                <UiDatePicker v-model="form.startDate" />
              </label>
              <label class="space-y-2">
                <span class="text-sm font-medium text-content">提醒时间</span>
                <input
                  v-model="form.startTime"
                  type="time"
                  class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <label class="space-y-2">
                <span class="text-sm font-medium text-content">频率</span>
                <select
                  v-model="form.frequency"
                  class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="daily">每日</option>
                  <option value="weekly">每周</option>
                  <option value="monthly">每月</option>
                  <option value="once">仅一次</option>
                </select>
              </label>
            </div>

            <div class="space-y-2">
              <span class="text-sm font-medium text-content">备注（可选）</span>
              <textarea
                v-model="form.notes"
                rows="3"
                placeholder="补充药品剂量、陪伴方式等细节"
                class="w-full rounded-2xl border border-outline/40 bg-surface-muted/70 px-4 py-3 text-sm leading-relaxed text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <p class="text-xs text-content/50">默认提前 15 分钟通过 App 提醒，可在任务详情中调整提醒方式。</p>
          </div>

          <div class="flex flex-wrap items-center gap-3 border-t border-outline/30 bg-surface px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <button type="button" class="flex-1 rounded-full border border-outline/40 px-4 py-3 text-sm text-content/70" @click="emit('close')">
              取消
            </button>
            <button type="submit" class="primary-button flex-1 justify-center" :disabled="!form.title.trim()">
              保存任务
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
import UiDatePicker from "@/components/molecules/UiDatePicker.vue";

interface TaskDraft {
  title: string;
  startDate: string;
  startTime: string;
  frequency: string;
  notes: string;
}

const props = defineProps<{ open: boolean }>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", payload: { title: string; startAt: string; frequency: string; notes: string }): void;
}>();

const form = reactive<TaskDraft>({
  title: "",
  startDate: getToday(),
  startTime: getNowTime(),
  frequency: "daily",
  notes: ""
});

watch(
  () => props.open,
  (value) => {
    if (!value) {
      resetForm();
    }
  }
);

function getToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getNowTime() {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function resetForm() {
  form.title = "";
  form.startDate = getToday();
  form.startTime = getNowTime();
  form.frequency = "daily";
  form.notes = "";
}

function handleSubmit() {
  const startAt = combineDateTime(form.startDate, form.startTime);
  emit("submit", {
    title: form.title.trim(),
    startAt,
    frequency: form.frequency,
    notes: form.notes.trim()
  });
  emit("close");
}

function combineDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map((part) => Number(part));
  const [hour, minute] = time.split(":").map((part) => Number(part));
  const composed = new Date(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0, 0, 0);
  return composed.toISOString();
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

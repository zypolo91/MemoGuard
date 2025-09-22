<template>
  <UiCard as="form" class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-content">快速记录新回忆</h3>
      <span class="text-xs text-content/60">平均耗时 <strong class="text-content">2 分钟</strong></span>
    </div>
    <label class="space-y-2 text-sm text-content/70">
      标题
      <input
        v-model="form.title"
        type="text"
        placeholder="例如：温泉之旅的傍晚"
        class="w-full rounded-2xl border border-outline/50 bg-surface px-4 py-3 text-content focus:border-primary focus:outline-none"
      />
    </label>
    <label class="space-y-2 text-sm text-content/70">
      片段描述
      <textarea
        v-model="form.content"
        placeholder="记录细节、对话或情绪..."
        rows="3"
        class="w-full rounded-2xl border border-outline/50 bg-surface px-4 py-3 text-sm text-content focus:border-primary focus:outline-none"
      />
    </label>
    <div class="grid grid-cols-2 gap-3 text-sm text-content/70">
      <label class="space-y-2">
        日期
        <input
          v-model="form.eventDate"
          type="date"
          class="w-full rounded-2xl border border-outline/50 bg-surface px-4 py-3 text-content focus:border-primary focus:outline-none"
        />
      </label>
      <label class="space-y-2">
        情绪
        <select
          v-model="form.mood"
          class="w-full rounded-2xl border border-outline/50 bg-surface px-4 py-3 text-content focus:border-primary focus:outline-none"
        >
          <option value="">选择情绪</option>
          <option value="温馨">温馨</option>
          <option value="惊喜">惊喜</option>
          <option value="感动">感动</option>
        </select>
      </label>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2 text-sm text-content/60">
        <UiIconButton><PhotoIcon class="h-5 w-5" /></UiIconButton>
        <UiIconButton><MicrophoneIcon class="h-5 w-5" /></UiIconButton>
        <UiIconButton><MapPinIcon class="h-5 w-5" /></UiIconButton>
      </div>
      <button class="primary-button" type="button" @click.prevent="handleSubmit">保存到时间轴</button>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { MapPinIcon, MicrophoneIcon, PhotoIcon } from "@heroicons/vue/24/outline";

import UiCard from "@/components/atoms/UiCard.vue";
import UiIconButton from "@/components/atoms/UiIconButton.vue";

const emit = defineEmits<{ (e: "create", payload: Record<string, unknown>): void }>();

const form = reactive({
  title: "",
  content: "",
  eventDate: new Date().toISOString().slice(0, 10),
  mood: ""
});

function handleSubmit() {
  emit("create", { ...form });
}
</script>

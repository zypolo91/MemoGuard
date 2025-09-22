<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="topic in topics"
      :key="topic"
      type="button"
      class="rounded-full border px-3 py-1 text-xs font-medium transition"
      :class="[
        modelValue === topic
          ? 'border-primary/60 bg-primary/10 text-primary'
          : 'border-outline/40 bg-surface-muted/60 text-content/60 hover:text-primary'
      ]"
      @click="$emit('update:modelValue', modelValue === topic ? null : topic)"
    >
      {{ topic }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  topics: string[];
  modelValue: string | null;
}>();

defineEmits<{
  (e: "update:modelValue", value: string | null): void;
}>();
</script>

<template>
  <div class="inline-flex rounded-full border border-outline/40 bg-surface-muted/60 p-1 text-xs font-medium text-content/70">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="rounded-full px-4 py-2 transition"
      :class="option.value === modelValue ? 'bg-primary text-primary-foreground shadow-soft' : 'hover:text-primary'"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Option<T = string> {
  label: string;
  value: T;
}

defineProps<{
  modelValue: string;
  options: Option[];
}>();

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

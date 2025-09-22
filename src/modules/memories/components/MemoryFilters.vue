<template>
  <div class="flex flex-wrap items-center gap-2">
    <button
      type="button"
      class="rounded-full border px-3 py-1 text-xs font-medium transition"
      :class="[
        activeTag === null
          ? 'border-primary/60 bg-primary/10 text-primary'
          : 'border-outline/40 bg-surface-muted/60 text-content/60 hover:text-primary'
      ]"
      @click="$emit('update:activeTag', null)"
    >
      全部
    </button>
    <button
      v-for="tag in tags"
      :key="tag"
      type="button"
      class="rounded-full border px-3 py-1 text-xs font-medium transition"
      :class="[
        activeTag === tag
          ? 'border-primary/60 bg-primary/10 text-primary'
          : 'border-outline/40 bg-surface-muted/60 text-content/60 hover:text-primary'
      ]"
      @click="$emit('update:activeTag', tag)"
    >
      {{ tag }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tags: string[];
  activeTag: string | null;
}>();

defineEmits<{
  (e: "update:activeTag", value: string | null): void;
}>();
</script>

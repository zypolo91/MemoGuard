<template>
  <header class="space-y-2">
    <p v-if="eyebrow" class="text-xs uppercase tracking-[0.3em] text-primary/80">
      {{ eyebrow }}
    </p>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div class="space-y-2">
        <h1 class="text-3xl font-semibold text-content">
          {{ title }}
        </h1>
        <p v-if="description" class="text-sm text-content/70">
          {{ description }}
        </p>
      </div>
      <div v-if="$slots.action" class="flex items-center gap-3">
        <slot name="action" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
}>();
</script>

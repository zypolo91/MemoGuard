<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
    <button
      v-for="action in actions"
      :key="action.label"
      type="button"
      class="flex h-24 flex-col items-start justify-between rounded-2xl border border-outline/40 bg-surface-muted/60 p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-primary/20"
    >
      <span class="text-xs font-medium uppercase tracking-widest text-primary/80">{{ action.eyebrow }}</span>
      <span class="text-sm font-semibold text-content">{{ action.label }}</span>
      <span class="text-[11px] text-content/60">{{ action.caption }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  actions: Array<{ eyebrow: string; label: string; caption: string }>;
}>();
</script>

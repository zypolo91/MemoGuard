<template>
  <header class="sticky top-0 z-30 border-b border-outline border-opacity-40 bg-surface/95 backdrop-blur-xl">
    <div class="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">{{ title }}</p>
        <h1 class="text-lg font-semibold text-content">{{ subtitle }}</h1>
      </div>
      <div class="hidden items-center gap-3 sm:flex">
        <slot />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
}>();
</script>

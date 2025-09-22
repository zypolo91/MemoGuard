<template>
  <div class="space-y-1">
    <div class="flex items-center justify-between text-sm">
      <span class="font-medium text-content/80">{{ label }}</span>
      <span class="text-content/60">{{ value }}%</span>
    </div>
    <div class="h-2 w-full overflow-hidden rounded-full bg-outline/20">
      <div
        class="h-full rounded-full bg-primary transition-all duration-500"
        :style="{ width: `${value}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: number }>();
</script>

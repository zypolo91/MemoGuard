<template>
  <div
    class="inline-flex items-center justify-center overflow-hidden rounded-full border border-outline border-opacity-40 bg-surface-muted"
    :class="sizeClass"
  >
    <img v-if="src" :src="src" :alt="alt" class="h-full w-full object-cover" />
    <span v-else class="text-sm font-medium text-content/70">{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    name?: string;
    size?: "sm" | "md" | "lg";
  }>(),
  {
    alt: "",
    name: "",
    size: "md"
  }
);

const initials = computed(() => props.name?.slice(0, 1).toUpperCase() ?? "");

const sizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "h-8 w-8";
    case "lg":
      return "h-16 w-16";
    default:
      return "h-12 w-12";
  }
});
</script>

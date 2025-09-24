<template>
  <component
    :is="as"
    v-bind="attrs"
    :class="computedClassList"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, useAttrs } from "vue";

interface Props {
  as?: string;
  padding?: string;
  hoverable?: boolean;
  variant?: "solid" | "soft";
}

const props = withDefaults(defineProps<Props>(), {
  as: "div",
  padding: "p-5",
  hoverable: false,
  variant: "soft"
});

const attrs = useAttrs();

const computedClassList = computed(() => {
  const classes: Array<string | undefined> = [
    "relative flex flex-col gap-4 rounded-3xl",
    props.padding,
    props.hoverable
      ? "transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20"
      : undefined,
    props.variant === "solid"
      ? "border border-outline border-opacity-40 bg-surface shadow-soft"
      : "glass-card bg-white/80 shadow-soft dark:bg-surface-muted/80"
  ];

  if (typeof attrs.class === "string") {
    classes.push(attrs.class);
  }

  return classes.filter(Boolean);
});
</script>




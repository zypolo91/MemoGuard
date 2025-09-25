<template>
  <nav class="border-t border-outline/50 bg-surface/95 backdrop-blur-lg">
    <ul class="mx-auto flex max-w-3xl items-center justify-around px-2 py-3">
      <li v-for="item in items" :key="item.name">
        <RouterLink
          :to="item.to"
          class="flex flex-col items-center gap-1 rounded-3xl px-3 py-2 text-xs transition"
          :class="
            route.name === item.name
              ? 'bg-primary/10 text-primary'
              : 'text-content/60 hover:text-primary/80'
          "
        >
          <slot name="icon" :item="item">
            <span class="text-base">•</span>
          </slot>
          <span>{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import { RouterLink, useRoute } from "vue-router";

export interface NavigationItem {
  name: string;
  to: { name: string };
  label: string;
  icon?: Component;
}

defineProps<{ items: NavigationItem[] }>();

const route = useRoute();
</script>

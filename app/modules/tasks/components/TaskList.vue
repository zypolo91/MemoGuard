<template>
  <div class="space-y-4">
    <TaskCard
      v-for="task in tasks"
      :key="task.id"
      :task="task"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import TaskCard from "./TaskCard.vue";
import type { CareTask } from "@/stores/tasks";

defineProps<{ tasks: CareTask[] }>();

defineEmits<{
  (e: "edit", task: CareTask): void;
  (e: "delete", task: CareTask): void;
}>();
</script>

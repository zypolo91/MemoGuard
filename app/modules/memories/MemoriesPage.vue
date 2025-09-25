<template>
  <section class="space-y-6 py-6">
    <PageHeader
      eyebrow="Memories Guardian"
      title="记忆守护"
      description="用现代化的卡片时间线留住珍贵瞬间。"
    />

    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-sm font-semibold text-content/70">内容视图</h2>
      <SegmentedControl v-model="activeView" :options="viewOptions" />
    </div>

    <UiCard v-if="activeView === 'timeline'" padding="p-5" class="space-y-4">
      <MemoryTimeline :memories="memories.items" @open="openDetail" />
      <p v-if="!memories.items.length" class="text-center text-sm text-content/60">
        还没有记录。点击右下角的按钮，写下第一段回忆吧。
      </p>
    </UiCard>

    <UiCard v-else padding="p-5" class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold text-content">按标签浏览</h3>
        <MemoryFilters v-model:active-tag="activeTag" :tags="memories.allTags" />
      </div>
      <div class="space-y-4">
        <MemoryCard v-for="item in filteredByTag" :key="item.id" :memory="item" @open="openDetail" />
        <p v-if="!filteredByTag.length" class="text-center text-sm text-content/60">
          换个标签，或添加一条新的回忆试试。
        </p>
      </div>
    </UiCard>

    <MemoryComposerSheet
      :open="isComposerOpen"
      :memory="editingMemory"
      @close="closeComposer"
      @submit="handleUpsert"
    />
    <MemoryDetailSheet
      :open="Boolean(detailMemory)"
      :memory="detailMemory"
      @close="closeDetail"
      @edit="editDetail"
      @delete="prepareDelete"
    />
    <MemoryDeleteSheet
      :open="Boolean(memoryPendingDelete)"
      :memory="memoryPendingDelete"
      @close="memoryPendingDelete = null"
      @confirm="handleConfirmDelete"
    />

    <UiFab @click="openComposer()">
      <PlusIcon class="h-6 w-6" />
    </UiFab>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { PlusIcon } from "@heroicons/vue/24/outline";

import UiCard from "@/components/atoms/UiCard.vue";
import UiFab from "@/components/atoms/UiFab.vue";
import MemoryCard from "@/modules/memories/components/MemoryCard.vue";
import MemoryComposerSheet from "@/modules/memories/components/MemoryComposerSheet.vue";
import MemoryDetailSheet from "@/modules/memories/components/MemoryDetailSheet.vue";
import MemoryDeleteSheet from "@/modules/memories/components/MemoryDeleteSheet.vue";
import MemoryFilters from "@/modules/memories/components/MemoryFilters.vue";
import MemoryTimeline from "@/modules/memories/components/MemoryTimeline.vue";
import SegmentedControl from "@/components/molecules/SegmentedControl.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import { useMemoriesStore } from "@/stores/memories";
import type { MemoryDraft, MemoryItem } from "@/stores/memories";

const memories = useMemoriesStore();

const activeView = ref("timeline");
const activeTag = ref<string | null>(null);
const isComposerOpen = ref(false);
const editingMemory = ref<MemoryItem | null>(null);
const detailMemory = ref<MemoryItem | null>(null);
const memoryPendingDelete = ref<MemoryItem | null>(null);

const viewOptions = [
  { label: "时间轴", value: "timeline" },
  { label: "按标签", value: "tags" }
];

onMounted(() => {
  if (memories.state === "idle") {
    memories.fetchMemories();
  }
});

const filteredByTag = computed(() => {
  if (!activeTag.value) {
    return memories.items;
  }
  return memories.items.filter((item) => item.tags.includes(activeTag.value as string));
});

function openComposer(memory?: MemoryItem | null) {
  editingMemory.value = memory ?? null;
  isComposerOpen.value = true;
}

function closeComposer() {
  isComposerOpen.value = false;
  editingMemory.value = null;
}

function handleUpsert(payload: MemoryDraft) {
  if (payload.id) {
    memories.updateMemory(payload.id, payload);
  } else {
    memories.addMemory(payload);
  }
}

function openDetail(memory: MemoryItem) {
  detailMemory.value = memory;
}

function closeDetail() {
  detailMemory.value = null;
}

function editDetail() {
  if (!detailMemory.value) return;
  openComposer(detailMemory.value);
  detailMemory.value = null;
}

function prepareDelete(id: string) {
  const target = memories.items.find((item) => item.id === id) ?? null;
  if (!target) return;
  memoryPendingDelete.value = target;
  detailMemory.value = null;
}

function handleConfirmDelete(id: string) {
  if (!id) {
    memoryPendingDelete.value = null;
    return;
  }

  memories.removeMemory(id);
  memoryPendingDelete.value = null;

  if (detailMemory.value?.id === id) {
    detailMemory.value = null;
  }

  if (editingMemory.value?.id === id) {
    closeComposer();
  }

  if (activeTag.value && !memories.items.some((item) => item.tags.includes(activeTag.value as string))) {
    activeTag.value = null;
  }
}
</script>





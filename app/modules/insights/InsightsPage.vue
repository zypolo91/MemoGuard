<template>
  <section class="space-y-6 py-6">
    <PageHeader eyebrow="Neuro Care News" title="资讯速览" />

    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-content/70">资讯浏览</h2>
      <SegmentedControl v-model="activeView" :options="viewOptions" />
    </div>

        <div v-if="topicTabOptions.length > 1" class="overflow-x-auto">
      <SegmentedControl
        v-model="activeTopicTab"
        :options="topicTabOptions"
      />
    </div>

    <InsightList :articles="filteredArticles" @bookmark="bookmark" @open="open" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import PageHeader from "@/components/molecules/PageHeader.vue";
import SegmentedControl from "@/components/molecules/SegmentedControl.vue";
import InsightList from "@/modules/insights/components/InsightList.vue";
import { useNewsStore } from "@/stores/news";

const store = useNewsStore();

const activeView = ref("latest");
const viewOptions = [
  { label: "最新", value: "latest" },
  { label: "收藏", value: "bookmark" }
];

const ALL_TOPICS_VALUE = "__all";
const activeTopicTab = ref<string>(ALL_TOPICS_VALUE);

onMounted(() => {
  if (store.state === "idle") {
    store.fetchNews();
  }
});

const topics = computed(() => store.topics);
const articles = computed(() => store.latest);
const bookmarkedArticles = computed(() => store.items.filter((article) => article.isBookmarked));

const topicTabOptions = computed(() => [
  { label: "全部", value: ALL_TOPICS_VALUE },
  ...topics.value.map((topic) => ({ label: topic, value: topic }))
]);

watch(topics, (nextTopics) => {
  if (activeTopicTab.value !== ALL_TOPICS_VALUE && !nextTopics.includes(activeTopicTab.value)) {
    activeTopicTab.value = ALL_TOPICS_VALUE;
  }
});

const activeTopic = computed(() => (activeTopicTab.value === ALL_TOPICS_VALUE ? null : activeTopicTab.value));

const filteredArticles = computed(() => {
  const base = activeView.value === "bookmark" ? bookmarkedArticles.value : articles.value;
  if (!activeTopic.value) return base;
  return base.filter((article) => article.topics.includes(activeTopic.value as string));
});

function bookmark(id: string) {
  store.toggleBookmark(id);
}

function open(url: string) {
  window.open(url, "_blank");
}
</script>


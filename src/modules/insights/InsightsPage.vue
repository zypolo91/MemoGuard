<template>
  <section class="space-y-6 py-6">
    <PageHeader eyebrow="Neuro Care News" title="资讯洞察" />

    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-content/70">资讯视图</h2>
      <SegmentedControl v-model="activeView" :options="viewOptions" />
    </div>

    <div class="grid gap-5 lg:grid-cols-[2fr,1fr]">
      <InsightList :articles="filteredArticles" @bookmark="bookmark" @open="open" />
      <UiCard padding="p-6" class="space-y-3">
        <h3 class="text-base font-semibold text-content">今日焦点</h3>
        <p class="text-sm text-content/70">{{ highlight?.summary ?? "为你精选认知健康快讯。" }}</p>
        <button v-if="highlight" class="primary-button" type="button" @click="open(highlight.url)">
          前往阅读
        </button>
      </UiCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import UiCard from "@/components/atoms/UiCard.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import SegmentedControl from "@/components/molecules/SegmentedControl.vue";
import InsightList from "@/modules/insights/components/InsightList.vue";
import TopicFilter from "@/modules/insights/components/TopicFilter.vue";
import { useNewsStore } from "@/stores/news";

const store = useNewsStore();

const activeTopic = ref<string | null>(null);
const activeView = ref("latest");

const viewOptions = [
  { label: "最新", value: "latest" },
  { label: "收藏", value: "bookmark" },
];

onMounted(() => {
  if (store.state === "idle") {
    store.fetchNews();
  }
});

const topics = computed(() => store.topics);
const articles = computed(() => store.latest);
const highlight = computed(() => articles.value[0] ?? null);
const bookmarkedArticles = computed(() => store.items.filter((article) => article.isBookmarked));

const filteredArticles = computed(() => {
  const base = activeView.value === "bookmark" ? bookmarkedArticles.value : articles.value;
  if (!activeTopic.value) return base;
  return base.filter((article) => article.topics.includes(activeTopic.value as string));
});

const todayCount = computed(
  () =>
    store.items.filter((article) => {
      const publishDate = new Date(article.publishedAt);
      const now = new Date();
      return publishDate.toDateString() === now.toDateString();
    }).length,
);

const bookmarkedCount = computed(() => bookmarkedArticles.value.length);

function bookmark(id: string) {
  store.toggleBookmark(id);
}

function open(url: string) {
  window.open(url, "_blank");
}
</script>

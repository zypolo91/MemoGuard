<template>
  <section class="space-y-6 py-6">
    <PageHeader
      eyebrow="Neuro Care News"
      title="资讯洞察"
      description="追踪认知健康的最新趋势与深度研究。"
    />

    <div class="grid gap-4 sm:grid-cols-3">
      <UiCard padding="p-6" class="space-y-2">
        <span class="text-xs text-content/60">今日新增</span>
        <p class="text-2xl font-semibold text-content">{{ todayCount }}</p>
        <span class="text-xs text-content/60">来自关注领域的最新更新</span>
      </UiCard>
      <UiCard padding="p-6" class="space-y-2">
        <span class="text-xs text-content/60">已收藏</span>
        <p class="text-2xl font-semibold text-content">{{ bookmarkedCount }}</p>
        <span class="text-xs text-content/60">方便稍后阅读与分享</span>
      </UiCard>
      <UiCard padding="p-6" class="space-y-2">
        <span class="text-xs text-content/60">关注主题</span>
        <p class="text-2xl font-semibold text-content">{{ topics.length }}</p>
        <span class="text-xs text-content/60">可按主题订阅筛选</span>
      </UiCard>
    </div>

    <UiCard padding="p-6" class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold text-content">主题优先级</h3>
        <button type="button" class="text-xs text-primary underline-offset-2 hover:underline">管理订阅</button>
      </div>
      <TopicFilter v-model="activeTopic" :topics="topics" />
    </UiCard>

    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-content/70">资讯视图</h2>
      <SegmentedControl v-model="activeView" :options="viewOptions" />
    </div>

    <div class="grid gap-5 lg:grid-cols-[2fr,1fr]">
      <InsightList :articles="filteredArticles" @bookmark="bookmark" @open="open" />
      <UiCard padding="p-6" class="space-y-3">
        <h3 class="text-base font-semibold text-content">今日焦点</h3>
        <p class="text-sm text-content/70">{{ highlight?.summary ?? '为你精选认知健康快讯。' }}</p>
        <button
          v-if="highlight"
          class="primary-button"
          type="button"
          @click="open(highlight.url)"
        >
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
  { label: "收藏", value: "bookmark" }
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

const todayCount = computed(() =>
  store.items.filter((article) => {
    const publishDate = new Date(article.publishedAt);
    const now = new Date();
    return publishDate.toDateString() === now.toDateString();
  }).length
);

const bookmarkedCount = computed(() => bookmarkedArticles.value.length);

function bookmark(id: string) {
  store.toggleBookmark(id);
}

function open(url: string) {
  window.open(url, "_blank");
}
</script>

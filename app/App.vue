<template>
  <AppShell>
    <template #header>
      <AppHeader title="MemoGuard" :subtitle="t('app.tagline')">
        <button class="primary-button" type="button">{{ t('cta.addMemory') }}</button>
        <UiIconButton>
          <BellAlertIcon class="h-5 w-5" />
        </UiIconButton>
      </AppHeader>
    </template>

    <RouterView />

    <template #mobile-nav>
      <BottomNavigation :items="navLinks">
        <template #icon="{ item }">
          <component :is="item.icon" class="h-5 w-5" />
        </template>
      </BottomNavigation>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterView } from "vue-router";
import {
  BellAlertIcon,
  BookmarkSquareIcon,
  NewspaperIcon,
  SparklesIcon,
  UserCircleIcon
} from "@heroicons/vue/24/outline";
import { PhotoIcon as MemoriesIcon } from "@heroicons/vue/24/solid";

import AppHeader from "@/components/organisms/AppHeader.vue";
import AppShell from "@/components/organisms/AppShell.vue";
import BottomNavigation from "@/components/molecules/BottomNavigation.vue";
import UiIconButton from "@/components/atoms/UiIconButton.vue";

const { t } = useI18n();

const navLinks = computed(() => [
  { name: "memories", to: { name: "memories" }, label: t("nav.memories"), icon: MemoriesIcon },
  { name: "tasks", to: { name: "tasks" }, label: t("nav.tasks"), icon: BellAlertIcon },
  { name: "nutrition", to: { name: "nutrition" }, label: t("nav.nutrition"), icon: SparklesIcon },
  { name: "insights", to: { name: "insights" }, label: t("nav.insights"), icon: NewspaperIcon },
  { name: "profile", to: { name: "profile" }, label: t("nav.profile"), icon: UserCircleIcon }
]);
</script>

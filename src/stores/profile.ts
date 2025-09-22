import { ref, watch } from "vue";
import { defineStore } from "pinia";

import { getProfile } from "@/services/mockApi/profile";
import { loadState, saveState } from "@/utils/storage";

export interface ProfilePreferences {
  notification: {
    dailyDigest: boolean;
    news: boolean;
    tasks: boolean;
  };
  language: string;
  theme: "light" | "dark" | "auto" | string;
}

export interface CareProfile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  streak: number;
  careFocus: string[];
  preferences: ProfilePreferences;
  followedTopics: string[];
}

const STORAGE_KEY = "profile";

export const useProfileStore = defineStore("profile", () => {
  const profile = ref<CareProfile | null>(loadState<CareProfile | null>(STORAGE_KEY, null));
  const state = ref<"idle" | "loading" | "success" | "error">(profile.value ? "success" : "idle");
  const error = ref<string | null>(null);

  async function fetchProfile() {
    state.value = "loading";
    error.value = null;
    try {
      profile.value = await getProfile();
      state.value = "success";
    } catch (err) {
      if (profile.value) {
        state.value = "success";
        error.value = null;
        return;
      }
      state.value = "error";
      error.value = err instanceof Error ? err.message : "加载失败";
    }
  }

  watch(
    profile,
    (value) => saveState(STORAGE_KEY, value),
    { deep: true }
  );

  return {
    profile,
    state,
    error,
    fetchProfile
  };
});

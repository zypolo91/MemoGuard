import { ref, watch } from "vue";
import { defineStore } from "pinia";

import { fetchCaregiverProfile, patchCaregiverProfile, type RemoteCareProfile } from "@/services/api/profile";
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

function adaptProfile(remote: RemoteCareProfile): CareProfile {
  return {
    id: remote.id,
    name: remote.fullName ?? "未命名照护者",
    role: "家庭照护者",
    avatar: remote.avatarUrl ?? "/media/avatar.png",
    streak: Number(remote.streak ?? 0),
    careFocus: remote.preferences?.followedTopics ?? [],
    preferences: {
      notification: {
        dailyDigest: remote.preferences?.notificationDailyDigest ?? true,
        news: remote.preferences?.notificationNews ?? true,
        tasks: remote.preferences?.notificationTasks ?? true
      },
      language: remote.preferences?.language ?? "zh-CN",
      theme: (remote.preferences?.theme ?? "auto") as ProfilePreferences["theme"]
    },
    followedTopics: remote.preferences?.followedTopics ?? []
  };
}
export const useProfileStore = defineStore("profile", () => {
  const profile = ref<CareProfile | null>(loadState<CareProfile | null>(STORAGE_KEY, null));
  const state = ref<"idle" | "loading" | "success" | "error">(profile.value ? "success" : "idle");
  const error = ref<string | null>(null);

  async function fetchProfile() {
    state.value = "loading";
    error.value = null;
    try {
      profile.value = adaptProfile(await fetchCaregiverProfile());
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


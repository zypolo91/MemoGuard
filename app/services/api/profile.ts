import { apiFetch } from "./client";

export interface RemoteCareProfile {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  streak?: string | null;
  bio?: string | null;
  preferences?: {
    notificationDailyDigest: boolean;
    notificationNews: boolean;
    notificationTasks: boolean;
    language: string;
    theme: string;
    followedTopics: string[];
  };
}

export async function fetchCaregiverProfile() {
  return apiFetch<RemoteCareProfile>("/caregiver", { method: "GET" });
}

export async function patchCaregiverProfile(payload: Partial<RemoteCareProfile>) {
  return apiFetch<RemoteCareProfile>("/caregiver", {
    method: "PATCH",
    json: payload
  });
}

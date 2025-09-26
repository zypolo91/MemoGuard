import { apiFetch } from "./client";
import type { CaregiverUpdatePayload } from "@/lib/dto/caregiver";

export interface CaregiverPreferencesRecord {
  id: string;
  caregiverId: string;
  notificationDailyDigest: boolean;
  notificationNews: boolean;
  notificationTasks: boolean;
  language: string;
  theme: string;
  followedTopics: string[];
}

export interface CaregiverProfileRecord {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  streak?: string | null;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
  preferences?: CaregiverPreferencesRecord | CaregiverPreferencesRecord[] | null;
}

function normalizePreferences(
  preferences?: CaregiverPreferencesRecord | CaregiverPreferencesRecord[] | null
): CaregiverPreferencesRecord | null {
  if (!preferences) return null;
  if (Array.isArray(preferences)) {
    return preferences[0] ?? null;
  }
  return preferences;
}

export async function getCaregiverProfile() {
  const profile = await apiFetch<CaregiverProfileRecord & { preferences?: CaregiverPreferencesRecord | CaregiverPreferencesRecord[] | null }>(
    "/api/caregiver"
  );
  return {
    ...profile,
    preferences: normalizePreferences(profile.preferences)
  };
}

export async function updateCaregiverProfile(payload: CaregiverUpdatePayload) {
  const profile = await apiFetch<CaregiverProfileRecord & { preferences?: CaregiverPreferencesRecord | CaregiverPreferencesRecord[] | null }>(
    "/api/caregiver",
    {
      method: "PATCH",
      json: payload
    }
  );
  return {
    ...profile,
    preferences: normalizePreferences(profile.preferences)
  };
}

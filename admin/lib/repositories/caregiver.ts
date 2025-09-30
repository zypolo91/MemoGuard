import { and, eq } from "drizzle-orm";
import { caregiverProfile, caregiverPreferences } from "../schema/caregiver";
import { getDb } from "../utils/db";
import { createId } from "../utils/id";
import type { CaregiverUpdatePayload } from "../dto/caregiver";

const CAREGIVER_ID = "caregiver-001";

export async function getCaregiverProfile(ownerAdminId: string) {
  const db = getDb();
  const profile = await db.query.caregiverProfile.findFirst({
    where: (fields, operators) => operators.eq(fields.ownerAdminId, ownerAdminId),
    with: {
      preferences: true
    }
  });
  return profile ?? null;
}

export async function ensureCaregiverProfile(ownerAdminId: string) {
  const db = getDb();
  const existing = await getCaregiverProfile(ownerAdminId);
  if (existing) return existing;
  await db.insert(caregiverProfile).values({
    id: createId(),
    fullName: "Demo Caregiver",
    streak: "0",
    bio: "",
    ownerAdminId
  });
  const created = await getCaregiverProfile(ownerAdminId);
  await db.insert(caregiverPreferences).values({
    id: createId(),
    caregiverId: created!.id,
    notificationDailyDigest: true,
    notificationNews: true,
    notificationTasks: true,
    language: "zh-CN",
    theme: "auto",
    followedTopics: []
  });
  return getCaregiverProfile(ownerAdminId);
}

export async function updateCaregiverProfile(ownerAdminId: string, updates: CaregiverUpdatePayload) {
  const db = getDb();
  const profile = (await ensureCaregiverProfile(ownerAdminId))!;

  if (updates.fullName !== undefined || updates.avatarUrl !== undefined || updates.bio !== undefined || updates.streak !== undefined) {
    await db
      .update(caregiverProfile)
      .set({
        ...(updates.fullName !== undefined && { fullName: updates.fullName }),
        ...(updates.avatarUrl !== undefined && { avatarUrl: updates.avatarUrl }),
        ...(updates.bio !== undefined && { bio: updates.bio }),
        ...(updates.streak !== undefined && { streak: updates.streak })
      })
      .where(eq(caregiverProfile.id, profile.id));
  }

  if (updates.preferences) {
    await db
      .update(caregiverPreferences)
      .set({
        ...(updates.preferences.notificationDailyDigest !== undefined && {
          notificationDailyDigest: updates.preferences.notificationDailyDigest
        }),
        ...(updates.preferences.notificationNews !== undefined && {
          notificationNews: updates.preferences.notificationNews
        }),
        ...(updates.preferences.notificationTasks !== undefined && {
          notificationTasks: updates.preferences.notificationTasks
        }),
        ...(updates.preferences.language !== undefined && { language: updates.preferences.language }),
        ...(updates.preferences.theme !== undefined && { theme: updates.preferences.theme }),
        ...(updates.preferences.followedTopics !== undefined && {
          followedTopics: updates.preferences.followedTopics
        })
      })
      .where(eq(caregiverPreferences.caregiverId, profile.id));
  }

  return getCaregiverProfile(ownerAdminId);
}

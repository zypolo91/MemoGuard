import "dotenv/config";

import { getDb } from "@/lib/utils/db";
import { createId } from "@/lib/utils/id";
import { hashPassword } from "@/lib/utils/password";
import {
  adminUsers,
  assessmentTemplates,
  caregiverPreferences,
  caregiverProfile,
  patientAssessments,
  patientProfile,
  users
} from "@/lib/schema";

async function seedPatient() {
  const db = getDb();
  await db
    .insert(patientProfile)
    .values({
      id: "patient-001",
      fullName: "\u6F14\u793A\u60A3\u8005",
      diagnosis: "\u963F\u5C14\u8328\u6D77\u9ED8\u75C7",
      notes: "\u521D\u59CB\u6F14\u793A\u6570\u636E"
    })
    .onConflictDoNothing({ target: patientProfile.id });

  const templates = [
    { id: "cognitive-moca", title: "MoCA", metric: "score", defaultUnit: "\u5206" },
    { id: "pet-amyloid", title: "Amyloid PET", metric: "amyloid", defaultUnit: "SUVR" },
    { id: "pet-tau", title: "PET Tau", metric: "tau", defaultUnit: "SUVR" }
  ];

  for (const template of templates) {
    await db
      .insert(assessmentTemplates)
      .values({
        id: template.id,
        title: template.title,
        metric: template.metric as any,
        defaultUnit: template.defaultUnit
      })
      .onConflictDoNothing({ target: assessmentTemplates.id });
  }

  const assessments = [
    {
      id: "assess-20240305",
      templateId: "cognitive-moca",
      label: "MoCA",
      metric: "score",
      value: 18.5,
      unit: "\u5206",
      status: "declining",
      date: "2024-03-05"
    },
    {
      id: "assess-20240830",
      templateId: "pet-tau",
      label: "PET Tau",
      metric: "tau",
      value: 1.28,
      unit: "SUVR",
      status: "stable",
      date: "2024-08-30"
    }
  ];

  for (const entry of assessments) {
    await db
      .insert(patientAssessments)
      .values({
        id: entry.id,
        patientId: "patient-001",
        templateId: entry.templateId,
        label: entry.label,
        metric: entry.metric as any,
        value: entry.value,
        unit: entry.unit,
        status: entry.status as any,
        recordedAt: entry.date
      })
      .onConflictDoNothing({ target: patientAssessments.id });
  }
}

async function seedCaregiver() {
  const db = getDb();
  await db
    .insert(caregiverProfile)
    .values({
      id: "caregiver-001",
      fullName: "\u6F14\u793A\u7167\u62A4\u8005",
      bio: "\u4E0E\u5BB6\u5C5E\u5171\u540C\u7BA1\u7406\u8BB0\u5FC6\u5185\u5BB9"
    })
    .onConflictDoNothing({ target: caregiverProfile.id });

  await db
    .insert(caregiverPreferences)
    .values({
      id: "caregiver-pref-001",
      caregiverId: "caregiver-001",
      followedTopics: ["\u8BA4\u77E5\u8BAD\u7EC3", "\u8425\u517B"],
      notificationDailyDigest: true,
      notificationNews: true,
      notificationTasks: true,
      language: "zh-CN",
      theme: "auto"
    })
    .onConflictDoNothing({ target: caregiverPreferences.id });
}

async function seedUsers() {
  const db = getDb();
  const demoUsers = [
    {
      id: "user-001",
      email: "patient@memoguard.app",
      fullName: "\u60A3\u8005\u8D26\u53F7",
      role: "patient",
      status: "active",
      metadata: { locale: "zh-CN" }
    },
    {
      id: "user-002",
      email: "family@memoguard.app",
      fullName: "\u5BB6\u5EAD\u6210\u5458",
      role: "family",
      status: "active",
      metadata: { locale: "zh-CN" }
    }
  ];

  for (const entry of demoUsers) {
    await db
      .insert(users)
      .values({
        id: entry.id,
        email: entry.email,
        fullName: entry.fullName,
        role: entry.role as any,
        status: entry.status as any,
        metadata: entry.metadata
      })
      .onConflictDoNothing({ target: users.email });
  }
}

async function seedAdminUsers() {
  const db = getDb();
  await db
    .insert(adminUsers)
    .values({
      id: "admin-001",
      username: "superadmin",
      passwordHash: hashPassword("Admin123!"),
      displayName: "\u7CFB\u7EDF\u7BA1\u7406\u5458",
      email: "admin@memoguard.app",
      role: "superadmin",
      status: "active"
    })
    .onConflictDoNothing({ target: adminUsers.username });

  await db
    .insert(adminUsers)
    .values({
      id: `admin-${createId()}`,
      username: "editor",
      passwordHash: hashPassword("Editor123!"),
      displayName: "\u5185\u5BB9\u7F16\u8F91",
      email: "editor@memoguard.app",
      role: "editor",
      status: "active"
    })
    .onConflictDoNothing({ target: adminUsers.username });
}

async function main() {
  const db = getDb();
  if (!db) {
    throw new Error("数据库未初始化，请确认已配置 DATABASE_URL");
  }

  await seedPatient();
  await seedCaregiver();
  await seedUsers();
  await seedAdminUsers();

  console.log("Seed completed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

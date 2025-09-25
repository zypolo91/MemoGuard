import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_PATH = path.resolve(__dirname, "..", "..", "app", "mock", "seed.json");
const ENV_PATH = path.resolve(__dirname, "..", ".env");

async function ensureEnv() {
  try {
    await import("dotenv/config");
  } catch (error) {
    if ((error as { code?: string }).code !== "ERR_MODULE_NOT_FOUND") {
      throw error;
    }
  }

  if (process.env.DATABASE_URL) {
    return;
  }

  try {
    const contents = await readFile(ENV_PATH, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue;
      const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      let value = rawValue.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch (error) {
    if ((error as { code?: string }).code !== "ENOENT") {
      console.warn("Failed to load .env file", error);
    }
  }
}

await ensureEnv();

const schema = await import("@/lib/schema");
const {
  adminUsers,
  caregiverPreferences,
  caregiverProfile,
  careTasks,
  insightArticles,
  memories,
  memoryAnnotations,
  memoryMedia,
  patientAssessments,
  patientProfile,
  assessmentTemplates,
  taskHistory
} = schema;

const { getDb } = await import("@/lib/utils/db");
const { createId } = await import("@/lib/utils/id");
const { hashPassword } = await import("@/lib/utils/password");

type MockMemory = {
  id: string;
  title: string;
  content: string;
  media?: Array<{
    id: string;
    type: string;
    url: string;
    thumbnail?: string;
    alt?: string;
  }>;
  createdAt?: string;
  eventDate: string;
  people?: string[];
  tags?: string[];
  mood?: string;
  location?: string;
  annotations?: Array<{
    id: string;
    type: string;
    targetId?: string;
    timestamp?: number;
    body?: string;
    createdBy?: string;
    createdAt?: string;
  }>;
};

type MockTask = {
  id: string;
  title: string;
  category?: string;
  frequency?: string;
  startAt?: string | null;
  endAt?: string | null;
  priority?: "low" | "medium" | "high";
  reminderLead?: number;
  reminderChannel?: string[];
  notes?: string;
  statusHistory?: Array<{
    status: "pending" | "in_progress" | "completed" | "skipped";
    timestamp: string;
  }>;
};

type MockNews = {
  id: string;
  title: string;
  source?: string;
  summary?: string;
  publishedAt?: string;
  topics?: string[];
  url?: string;
  highlight?: string;
  isBookmarked?: boolean;
};

type MockProfile = {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  streak?: number;
  careFocus?: string[];
  preferences?: {
    notification?: {
      dailyDigest?: boolean;
      news?: boolean;
      tasks?: boolean;
    };
    language?: string;
    theme?: string;
  };
  followedTopics?: string[];
};

type MockData = {
  memories?: MockMemory[];
  tasks?: MockTask[];
  news?: MockNews[];
  profile?: MockProfile;
  recipes?: unknown;
};

async function loadMockData(): Promise<MockData> {
  const file = await readFile(MOCK_PATH, "utf8");
  const sanitized = file.replace(/^\uFEFF/, "");
  return JSON.parse(sanitized) as MockData;
}

function parseDate(input?: string | null): Date | null {
  if (!input) return null;
  const value = new Date(input);
  if (Number.isNaN(value.getTime())) return null;
  return value;
}

async function importMemories(mock: MockMemory[]) {
  const db = getDb();
  for (const memory of mock) {
    const createdAt = parseDate(memory.createdAt) ?? new Date();

    await db
      .insert(memories)
      .values({
        id: memory.id,
        title: memory.title,
        content: memory.content,
        richText: null,
        coverMediaId: memory.media?.[0]?.id,
        eventDate: memory.eventDate,
        mood: memory.mood,
        location: memory.location,
        tags: memory.tags ?? [],
        people: memory.people ?? [],
        createdAt,
        updatedAt: createdAt
      })
      .onConflictDoUpdate({
        target: memories.id,
        set: {
          title: memory.title,
          content: memory.content,
          coverMediaId: memory.media?.[0]?.id,
          eventDate: memory.eventDate,
          mood: memory.mood,
          location: memory.location,
          tags: memory.tags ?? [],
          people: memory.people ?? [],
          updatedAt: new Date()
        }
      });

    await db.delete(memoryMedia).where(eq(memoryMedia.memoryId, memory.id));
    if (memory.media?.length) {
      await db.insert(memoryMedia).values(
        memory.media.map((media) => ({
          id: media.id,
          memoryId: memory.id,
          type: media.type,
          url: media.url,
          thumbnailUrl: media.thumbnail,
          altText: media.alt,
          createdAt
        }))
      );
    }

    await db.delete(memoryAnnotations).where(eq(memoryAnnotations.memoryId, memory.id));
    if (memory.annotations?.length) {
      await db.insert(memoryAnnotations).values(
        memory.annotations.map((annotation) => ({
          id: annotation.id,
          memoryId: memory.id,
          type: annotation.type,
          payload: {
            targetId: annotation.targetId,
            timestamp: annotation.timestamp,
            body: annotation.body,
            createdBy: annotation.createdBy
          },
          createdAt: parseDate(annotation.createdAt) ?? new Date()
        }))
      );
    }
  }
}

async function importTasks(mock: MockTask[]) {
  const db = getDb();
  for (const task of mock) {
    const dueAt = parseDate(task.endAt) ?? parseDate(task.startAt);

    await db
      .insert(careTasks)
      .values({
        id: task.id,
        title: task.title,
        description: task.notes ?? null,
        priority: task.priority ?? "medium",
        frequency: task.frequency ?? null,
        dueAt
      })
      .onConflictDoUpdate({
        target: careTasks.id,
        set: {
          title: task.title,
          description: task.notes ?? null,
          priority: task.priority ?? "medium",
          frequency: task.frequency ?? null,
          dueAt,
          updatedAt: new Date()
        }
      });

    await db.delete(taskHistory).where(eq(taskHistory.taskId, task.id));
    if (task.statusHistory?.length) {
      await db.insert(taskHistory).values(
        task.statusHistory.map((history) => ({
          id: createId(),
          taskId: task.id,
          status: history.status,
          changedAt: parseDate(history.timestamp) ?? new Date(),
          payload: {
            reminderLead: task.reminderLead,
            reminderChannel: task.reminderChannel,
            notes: task.notes
          }
        }))
      );
    }
  }
}

async function importNews(mock: MockNews[]) {
  const db = getDb();
  for (const article of mock) {
    const publishedAt = parseDate(article.publishedAt) ?? new Date();

    await db
      .insert(insightArticles)
      .values({
        id: article.id,
        title: article.title,
        source: article.source ?? null,
        summary: article.summary ?? article.highlight ?? null,
        topic: article.topics?.[0] ?? null,
        contentUrl: article.url ?? null,
        isBookmarked: article.isBookmarked ?? false,
        publishedAt,
        createdAt: publishedAt
      })
      .onConflictDoUpdate({
        target: insightArticles.id,
        set: {
          title: article.title,
          source: article.source ?? null,
          summary: article.summary ?? article.highlight ?? null,
          topic: article.topics?.[0] ?? null,
          contentUrl: article.url ?? null,
          isBookmarked: article.isBookmarked ?? false,
          publishedAt
        }
      });
  }
}

async function importProfile(profile: MockProfile) {
  const db = getDb();
  const id = profile.id || "caregiver-001";

  await db
    .insert(caregiverProfile)
    .values({
      id,
      fullName: profile.name,
      avatarUrl: profile.avatar ?? null,
      streak: profile.streak?.toString() ?? null,
      bio: profile.careFocus?.join("\u3001") ?? null
    })
    .onConflictDoUpdate({
      target: caregiverProfile.id,
      set: {
        fullName: profile.name,
        avatarUrl: profile.avatar ?? null,
        streak: profile.streak?.toString() ?? null,
        bio: profile.careFocus?.join("\u3001") ?? null,
        updatedAt: new Date()
      }
    });

  const notification = profile.preferences?.notification;

  await db
    .insert(caregiverPreferences)
    .values({
      id: `${id}-prefs`,
      caregiverId: id,
      followedTopics: profile.followedTopics ?? [],
      notificationDailyDigest: notification?.dailyDigest ?? true,
      notificationNews: notification?.news ?? true,
      notificationTasks: notification?.tasks ?? true,
      language: profile.preferences?.language ?? "zh-CN",
      theme: profile.preferences?.theme ?? "auto"
    })
    .onConflictDoUpdate({
      target: caregiverPreferences.id,
      set: {
        followedTopics: profile.followedTopics ?? [],
        notificationDailyDigest: notification?.dailyDigest ?? true,
        notificationNews: notification?.news ?? true,
        notificationTasks: notification?.tasks ?? true,
        language: profile.preferences?.language ?? "zh-CN",
        theme: profile.preferences?.theme ?? "auto"
      }
    });
}

async function ensureAdmin() {
  const db = getDb();
  await db
    .insert(adminUsers)
    .values({
      id: "admin-mock-001",
      username: "mock-admin",
      passwordHash: hashPassword("MockAdmin123!"),
      displayName: "Mock \u7BA1\u7406\u5458",
      email: "mock-admin@memoguard.app",
      role: "editor",
      status: "active"
    })
    .onConflictDoUpdate({
      target: adminUsers.username,
      set: {
        displayName: "Mock \u7BA1\u7406\u5458",
        email: "mock-admin@memoguard.app",
        role: "editor",
        status: "active"
      }
    });
}

async function main() {
  const mock = await loadMockData();
  const db = getDb();
  if (!db) {
    throw new Error("数据库未初始化，请确认已配置 DATABASE_URL");
  }

  if (mock.memories?.length) {
    await importMemories(mock.memories);
  }
  if (mock.tasks?.length) {
    await importTasks(mock.tasks);
  }
  if (mock.news?.length) {
    await importNews(mock.news);
  }
  if (mock.profile) {
    await importProfile(mock.profile);
  }

  await db
    .insert(patientProfile)
    .values({
      id: "patient-001",
      fullName: "\u6F14\u793A\u60A3\u8005",
      diagnosis: "\u963F\u5C14\u8328\u6D77\u9ED8\u75C7",
      notes: "\u4ECE\u524D\u7AEF mock \u5BFC\u5165"
    })
    .onConflictDoNothing({ target: patientProfile.id });

  await db
    .insert(assessmentTemplates)
    .values({
      id: "template-demo",
      title: "Demo Template",
      metric: "score",
      defaultUnit: "\u5206"
    })
    .onConflictDoNothing({ target: assessmentTemplates.id });

  await db
    .insert(patientAssessments)
    .values({
      id: "assessment-demo",
      patientId: "patient-001",
      templateId: "template-demo",
      metric: "score",
      value: 20,
      unit: "\u5206",
      status: "stable",
      recordedAt: new Date()
    })
    .onConflictDoNothing({ target: patientAssessments.id });

  await ensureAdmin();

  console.log("Mock data import completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

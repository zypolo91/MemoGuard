CREATE TYPE "task_priority" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "task_status" AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
CREATE TYPE "assessment_metric" AS ENUM ('tau', 'amyloid', 'metabolism', 'cognition', 'score');
CREATE TYPE "assessment_status" AS ENUM ('stable', 'improving', 'declining', 'critical');
CREATE TYPE "user_role" AS ENUM ('patient', 'caregiver', 'family', 'guest');
CREATE TYPE "user_status" AS ENUM ('invited', 'active', 'inactive', 'suspended');
CREATE TYPE "admin_role" AS ENUM ('superadmin', 'manager', 'editor', 'viewer');
CREATE TYPE "admin_status" AS ENUM ('active', 'inactive', 'suspended');

CREATE TABLE "memories" (
    "id" varchar(36) PRIMARY KEY,
    "title" varchar(120) NOT NULL,
    "content" text NOT NULL,
    "rich_text" text,
    "cover_media_id" varchar(36),
    "event_date" date NOT NULL,
    "mood" varchar(32),
    "location" varchar(120),
    "tags" text[] NOT NULL DEFAULT ARRAY[]::text[],
    "people" text[] NOT NULL DEFAULT ARRAY[]::text[],
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "memory_media" (
    "id" varchar(36) PRIMARY KEY,
    "memory_id" varchar(36) NOT NULL REFERENCES "memories"("id") ON DELETE CASCADE,
    "type" varchar(16) NOT NULL,
    "url" text NOT NULL,
    "thumbnail_url" text,
    "alt_text" varchar(160),
    "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "memory_annotations" (
    "id" varchar(36) PRIMARY KEY,
    "memory_id" varchar(36) NOT NULL REFERENCES "memories"("id") ON DELETE CASCADE,
    "type" varchar(24) NOT NULL,
    "payload" jsonb NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "memory_insights" (
    "id" varchar(36) PRIMARY KEY,
    "memory_id" varchar(36) NOT NULL REFERENCES "memories"("id") ON DELETE CASCADE,
    "summary" text NOT NULL,
    "highlights" text[] NOT NULL DEFAULT ARRAY[]::text[],
    "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "care_tasks" (
    "id" varchar(36) PRIMARY KEY,
    "title" varchar(160) NOT NULL,
    "description" text,
    "priority" "task_priority" NOT NULL DEFAULT 'medium',
    "frequency" varchar(32),
    "due_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "streak" integer NOT NULL DEFAULT 0
);

CREATE TABLE "task_reminders" (
    "id" varchar(36) PRIMARY KEY,
    "task_id" varchar(36) NOT NULL REFERENCES "care_tasks"("id") ON DELETE CASCADE,
    "status" "task_status" NOT NULL DEFAULT 'pending',
    "timestamp" timestamptz NOT NULL,
    "notes" text
);

CREATE TABLE "task_history" (
    "id" varchar(36) PRIMARY KEY,
    "task_id" varchar(36) NOT NULL REFERENCES "care_tasks"("id") ON DELETE CASCADE,
    "status" "task_status" NOT NULL,
    "changed_at" timestamptz NOT NULL DEFAULT now(),
    "payload" jsonb
);

CREATE TABLE "assessment_templates" (
    "id" varchar(48) PRIMARY KEY,
    "title" varchar(120) NOT NULL,
    "description" text,
    "metric" "assessment_metric" NOT NULL,
    "default_unit" varchar(24),
    "lower_bound" numeric(12, 4),
    "upper_bound" numeric(12, 4),
    "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "patient_profile" (
    "id" varchar(36) PRIMARY KEY,
    "full_name" varchar(120) NOT NULL,
    "avatar_url" text,
    "birth_date" timestamp,
    "diagnosis" varchar(160),
    "notes" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "patient_assessments" (
    "id" varchar(36) PRIMARY KEY,
    "patient_id" varchar(36) NOT NULL REFERENCES "patient_profile"("id") ON DELETE CASCADE,
    "template_id" varchar(48) NOT NULL REFERENCES "assessment_templates"("id"),
    "label" varchar(120),
    "metric" "assessment_metric" NOT NULL,
    "value" numeric(12, 4) NOT NULL,
    "unit" varchar(24),
    "status" "assessment_status" NOT NULL DEFAULT 'stable',
    "notes" text,
    "recorded_at" timestamp NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "insight_articles" (
    "id" varchar(36) PRIMARY KEY,
    "title" varchar(180) NOT NULL,
    "source" varchar(120),
    "summary" text,
    "topic" varchar(64),
    "content_url" text,
    "is_bookmarked" boolean NOT NULL DEFAULT false,
    "published_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "caregiver_profile" (
    "id" varchar(36) PRIMARY KEY,
    "full_name" varchar(120) NOT NULL,
    "avatar_url" text,
    "streak" varchar(32),
    "bio" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "caregiver_preferences" (
    "id" varchar(36) PRIMARY KEY,
    "caregiver_id" varchar(36) NOT NULL REFERENCES "caregiver_profile"("id") ON DELETE CASCADE,
    "notification_daily_digest" boolean NOT NULL DEFAULT true,
    "notification_news" boolean NOT NULL DEFAULT true,
    "notification_tasks" boolean NOT NULL DEFAULT true,
    "language" varchar(16) NOT NULL DEFAULT 'zh-CN',
    "theme" varchar(16) NOT NULL DEFAULT 'auto',
    "followed_topics" text[] NOT NULL DEFAULT ARRAY[]::text[]
);

CREATE TABLE "users" (
    "id" varchar(36) PRIMARY KEY,
    "email" varchar(160) NOT NULL,
    "phone" varchar(32),
    "full_name" varchar(120) NOT NULL,
    "avatar_url" text,
    "role" "user_role" NOT NULL DEFAULT 'patient',
    "status" "user_status" NOT NULL DEFAULT 'invited',
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "last_login_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");
CREATE UNIQUE INDEX "users_phone_idx" ON "users" ("phone");

CREATE TABLE "admin_users" (
    "id" varchar(36) PRIMARY KEY,
    "username" varchar(48) NOT NULL,
    "password_hash" text NOT NULL,
    "email" varchar(160),
    "display_name" varchar(120) NOT NULL,
    "role" "admin_role" NOT NULL DEFAULT 'viewer',
    "status" "admin_status" NOT NULL DEFAULT 'active',
    "last_login_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "admin_users_username_idx" ON "admin_users" ("username");
CREATE UNIQUE INDEX "admin_users_email_idx" ON "admin_users" ("email");

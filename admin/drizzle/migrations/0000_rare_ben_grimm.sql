CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."assessment_metric" AS ENUM('tau', 'amyloid', 'metabolism', 'cognition', 'score');--> statement-breakpoint
CREATE TYPE "public"."assessment_status" AS ENUM('stable', 'improving', 'declining', 'critical');--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('superadmin', 'manager', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."admin_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('patient', 'caregiver', 'family', 'guest');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('invited', 'active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TABLE "caregiver_preferences" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"caregiver_id" varchar(36) NOT NULL,
	"notification_daily_digest" boolean DEFAULT true NOT NULL,
	"notification_news" boolean DEFAULT true NOT NULL,
	"notification_tasks" boolean DEFAULT true NOT NULL,
	"language" varchar(16) DEFAULT 'zh-CN' NOT NULL,
	"theme" varchar(16) DEFAULT 'auto' NOT NULL,
	"followed_topics" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "caregiver_profile" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"avatar_url" text,
	"streak" varchar(32),
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memories" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(120) NOT NULL,
	"content" text NOT NULL,
	"rich_text" text,
	"cover_media_id" varchar(36),
	"event_date" date NOT NULL,
	"mood" varchar(32),
	"location" varchar(120),
	"tags" text[] DEFAULT '{}' NOT NULL,
	"people" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_annotations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"memory_id" varchar(36) NOT NULL,
	"type" varchar(24) NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_insights" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"memory_id" varchar(36) NOT NULL,
	"summary" text NOT NULL,
	"highlights" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_media" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"memory_id" varchar(36) NOT NULL,
	"type" varchar(16) NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"alt_text" varchar(160),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_tasks" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"frequency" varchar(32),
	"due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_history" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"task_id" varchar(36) NOT NULL,
	"status" "task_status" NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload" jsonb
);
--> statement-breakpoint
CREATE TABLE "task_reminders" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"task_id" varchar(36) NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "assessment_templates" (
	"id" varchar(48) PRIMARY KEY NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text,
	"metric" "assessment_metric" NOT NULL,
	"default_unit" varchar(24),
	"lower_bound" numeric(12, 4),
	"upper_bound" numeric(12, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_assessments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"patient_id" varchar(36) NOT NULL,
	"template_id" varchar(48) NOT NULL,
	"label" varchar(120),
	"metric" "assessment_metric" NOT NULL,
	"value" numeric(12, 4) NOT NULL,
	"unit" varchar(24),
	"status" "assessment_status" DEFAULT 'stable' NOT NULL,
	"notes" text,
	"recorded_at" timestamp NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_profile" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"avatar_url" text,
	"birth_date" timestamp,
	"diagnosis" varchar(160),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insight_articles" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(180) NOT NULL,
	"source" varchar(120),
	"summary" text,
	"topic" varchar(64),
	"content_url" text,
	"is_bookmarked" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"username" varchar(48) NOT NULL,
	"password_hash" text NOT NULL,
	"email" varchar(160),
	"display_name" varchar(120) NOT NULL,
	"role" "admin_role" DEFAULT 'viewer' NOT NULL,
	"status" "admin_status" DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(160) NOT NULL,
	"phone" varchar(32),
	"full_name" varchar(120) NOT NULL,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'patient' NOT NULL,
	"status" "user_status" DEFAULT 'invited' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "caregiver_preferences" ADD CONSTRAINT "caregiver_preferences_caregiver_id_caregiver_profile_id_fk" FOREIGN KEY ("caregiver_id") REFERENCES "public"."caregiver_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_annotations" ADD CONSTRAINT "memory_annotations_memory_id_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_insights" ADD CONSTRAINT "memory_insights_memory_id_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_media" ADD CONSTRAINT "memory_media_memory_id_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_task_id_care_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."care_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reminders" ADD CONSTRAINT "task_reminders_task_id_care_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."care_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_assessments" ADD CONSTRAINT "patient_assessments_patient_id_patient_profile_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_assessments" ADD CONSTRAINT "patient_assessments_template_id_assessment_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."assessment_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_username_idx" ON "admin_users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_idx" ON "users" USING btree ("phone");
CREATE TABLE "upload_records" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"bucket" varchar(64) NOT NULL,
	"path" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" varchar(128) NOT NULL,
	"size" bigint NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"owner_admin_id" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "caregiver_profile" ADD COLUMN "owner_admin_id" varchar(36);--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "owner_admin_id" varchar(36);--> statement-breakpoint
ALTER TABLE "care_tasks" ADD COLUMN "owner_admin_id" varchar(36);--> statement-breakpoint
ALTER TABLE "patient_profile" ADD COLUMN "owner_admin_id" varchar(36);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "upload_records" ADD CONSTRAINT "upload_records_owner_admin_id_admin_users_id_fk" FOREIGN KEY ("owner_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caregiver_profile" ADD CONSTRAINT "caregiver_profile_owner_admin_id_admin_users_id_fk" FOREIGN KEY ("owner_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_owner_admin_id_admin_users_id_fk" FOREIGN KEY ("owner_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_tasks" ADD CONSTRAINT "care_tasks_owner_admin_id_admin_users_id_fk" FOREIGN KEY ("owner_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_profile" ADD CONSTRAINT "patient_profile_owner_admin_id_admin_users_id_fk" FOREIGN KEY ("owner_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;
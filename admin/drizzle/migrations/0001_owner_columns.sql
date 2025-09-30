-- Add owner_admin_id columns to scope records per admin user
ALTER TABLE "memories" ADD COLUMN IF NOT EXISTS "owner_admin_id" varchar(36) REFERENCES "admin_users"("id");
ALTER TABLE "care_tasks" ADD COLUMN IF NOT EXISTS "owner_admin_id" varchar(36) REFERENCES "admin_users"("id");
ALTER TABLE "patient_profile" ADD COLUMN IF NOT EXISTS "owner_admin_id" varchar(36) REFERENCES "admin_users"("id");
ALTER TABLE "caregiver_profile" ADD COLUMN IF NOT EXISTS "owner_admin_id" varchar(36) REFERENCES "admin_users"("id");
ALTER TABLE "upload_records" ADD COLUMN IF NOT EXISTS "owner_admin_id" varchar(36) REFERENCES "admin_users"("id");

-- Optional: simple indexes to speed up filtering
CREATE INDEX IF NOT EXISTS "memories_owner_idx" ON "memories" ("owner_admin_id");
CREATE INDEX IF NOT EXISTS "care_tasks_owner_idx" ON "care_tasks" ("owner_admin_id");
CREATE INDEX IF NOT EXISTS "patient_profile_owner_idx" ON "patient_profile" ("owner_admin_id");
CREATE INDEX IF NOT EXISTS "caregiver_profile_owner_idx" ON "caregiver_profile" ("owner_admin_id");
CREATE INDEX IF NOT EXISTS "upload_records_owner_idx" ON "upload_records" ("owner_admin_id");


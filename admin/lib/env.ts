import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url("SUPABASE_URL 必须为有效的 URL").optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY 不能为空").optional(),
  SUPABASE_UPLOADS_BUCKET: z.string().min(1, "SUPABASE_UPLOADS_BUCKET 不能为空").default("uploads")
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_UPLOADS_BUCKET: process.env.SUPABASE_UPLOADS_BUCKET
});

if (!parsed.success) {
  console.error("Environment variable validation failed", parsed.error.flatten().fieldErrors);
  throw new Error("环境变量配置不完整，请检查 .env 文件。");
}

export const env = parsed.data;

export function assertSupabaseCredentials() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase 未配置，请在环境变量中设置 SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY。");
  }

  return {
    supabaseUrl: env.SUPABASE_URL,
    supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: env.SUPABASE_UPLOADS_BUCKET
  };
}

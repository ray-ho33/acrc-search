/**
 * Node 스크립트 전용 Supabase 클라이언트 (서비스 키).
 * Next.js 앱의 lib/db.ts 와 동일한 env 규칙을 따른다.
 */

import { createClient } from "@supabase/supabase-js";
import { loadProjectEnv } from "./load-env.mjs";
import { assertServiceRoleKey } from "./jwt-role.mjs";

function requireEnv(name) {
  loadProjectEnv();
  const value = process.env[name];
  if (!value || String(value).trim() === "") {
    throw new Error(
      `[env] ${name} 가 .env 에 설정되지 않았습니다. .env.example 을 참고해 채워주세요.`,
    );
  }
  return String(value).trim();
}

/**
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
export function createScriptSupabaseClient() {
  const url = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_KEY");
  assertServiceRoleKey(serviceKey);
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

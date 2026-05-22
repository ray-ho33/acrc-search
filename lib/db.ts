// Supabase 클라이언트 단일 진입점
// 다른 코드는 절대로 직접 createClient() 를 부르지 말고
// 이 파일이 제공하는 두 함수만 사용한다.
// (PRD/04_PROJECT_SPEC.md §3.2)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 환경변수 누락 시 명확한 에러로 죽인다. 부팅 단계에서 발견하는 게
// 안전하고, 런타임에서 의문스러운 동작을 보는 것보다 훨씬 낫다.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `[env] ${name} 가 .env 에 설정되지 않았습니다. .env.example 을 참고해 채워주세요.`
    );
  }
  return value;
}

let cachedServerClient: SupabaseClient | null = null;

// 서버 사이드 전용 (API 라우트, Server Component, Route Handler)
// SERVICE_KEY 를 사용하므로 RLS 를 우회한다. 절대 브라우저로 넘어가서는 안 된다.
export function createServerSupabaseClient(): SupabaseClient {
  if (cachedServerClient) return cachedServerClient;

  const url = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_KEY");

  cachedServerClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedServerClient;
}

// 브라우저 전용 (Client Component "use client")
// ANON_KEY 만 사용하므로 RLS 정책에 묶인다. MVP 단계는 RLS 미적용이라
// 사실상 읽기 전용으로 본다. (PRD/02_DATA_MODEL.md §5)
let cachedBrowserClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient(): SupabaseClient {
  if (cachedBrowserClient) return cachedBrowserClient;

  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  cachedBrowserClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedBrowserClient;
}

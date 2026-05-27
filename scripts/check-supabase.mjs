#!/usr/bin/env node
/**
 * Supabase 연결·키 종류·테이블 권한 빠른 진단
 *   node scripts/check-supabase.mjs
 */

import { loadProjectEnv } from "./lib/load-env.mjs";
import { createScriptSupabaseClient } from "./lib/supabase-server.mjs";
import { jwtRole } from "./lib/jwt-role.mjs";

loadProjectEnv();

const url = process.env.SUPABASE_URL?.trim();
const service = process.env.SUPABASE_SERVICE_KEY?.trim();
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

console.log("=== Supabase 진단 ===\n");

if (!url) console.log("❌ SUPABASE_URL 없음");
else console.log(`✓ SUPABASE_URL: ${url.slice(0, 40)}…`);

if (!service) console.log("❌ SUPABASE_SERVICE_KEY 없음");
else {
  const role = jwtRole(service) ?? "(JWT 아님 — sb_secret_ 형식일 수 있음)";
  console.log(`✓ SUPABASE_SERVICE_KEY 길이: ${service.length}, JWT role: ${role}`);
  if (role === "anon") {
    console.log("  ⚠️  service_role 이 아니라 anon 키입니다. API > service_role (secret) 로 바꾸세요.");
  }
}

if (!anon) console.log("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 없음");
else {
  console.log(
    `✓ ANON_KEY 길이: ${anon.length}, JWT role: ${jwtRole(anon)}`,
  );
}

if (service && anon && service === anon) {
  console.log("\n❌ SERVICE_KEY 와 ANON_KEY 가 동일합니다. 반드시 다른 키를 쓰세요.");
  process.exit(1);
}

if (service && jwtRole(service) === "anon") {
  console.log("\n❌ SERVICE_KEY 를 service_role (secret) 로 바꾼 뒤 다시 실행하세요.");
  process.exit(1);
}

console.log("\n--- DB 접근 테스트 ---\n");

const supabase = createScriptSupabaseClient();

const { count, error: countErr } = await supabase
  .from("documents")
  .select("*", { count: "exact", head: true });

if (countErr) {
  console.log(`SELECT count 실패: ${countErr.message}`);
  console.log(`  code: ${countErr.code ?? "-"}`);
  console.log(`  details: ${countErr.details ?? "-"}`);
  console.log(`  hint: ${countErr.hint ?? "-"}`);
} else {
  console.log(`SELECT count 성공 — documents 현재 ${count ?? 0}건`);
}

const probeId = `diag-${Date.now()}`;
const { error: upsertErr } = await supabase.from("documents").upsert(
  {
    source: "권익위",
    type: "의결례",
    external_id: probeId,
    title: "연결 테스트 (삭제해도 됨)",
    summary: "check-supabase.mjs",
    full_text: null,
    url: null,
  },
  { onConflict: "external_id" },
);

if (upsertErr) {
  console.log(`UPSERT 테스트 실패: ${upsertErr.message}`);
  console.log("\n다음 확인:");
  console.log("  1) SQL Editor에서 supabase/migrations/002_grants.sql 실행");
  console.log("  2) Table Editor > documents > RLS 가 켜져 있으면 잠시 끄거나 정책 추가");
  console.log("  3) Project Settings > API > Legacy API Keys 의 service_role JWT 사용");
} else {
  console.log("UPSERT 테스트 성공 — service_role + GRANT 정상");
  await supabase.from("documents").delete().eq("external_id", probeId);
  console.log("테스트 행 삭제 완료");
}

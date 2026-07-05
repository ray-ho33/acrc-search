-- ============================================================
-- 006_restrict_anon_reads.sql — anon/authenticated 읽기 권한 축소
-- ------------------------------------------------------------
-- 002_grants.sql 이 feedback / users / document_embeds 에도
-- anon SELECT 를 부여해, 브라우저 anon 키만으로 Supabase REST API 를 통해
--   - feedback.note (조사관 환류 메모, PRD 상 "본인만 보임")
--   - users.email
--   - document_embeds.embedding (임베딩 벡터 전체)
-- 를 조회할 수 있는 상태였다. 이 세 테이블의 읽기 권한을 회수한다.
--
-- 앱은 세 테이블 모두 service_role 경유(서버 라우트/스크립트)로만 접근하므로
-- 기능 영향 없음. documents 의 anon SELECT 는 공개 자료이므로 유지한다.
-- ============================================================

revoke select on table public.feedback from anon, authenticated;
revoke select on table public.users from anon, authenticated;
revoke select on table public.document_embeds from anon, authenticated;

-- 002 의 default privileges 가 "이후 새 테이블에도 anon SELECT 자동 부여"로
-- 되어 있어 같은 문제가 재발한다. 기본 권한에서도 제거한다.
alter default privileges in schema public
  revoke select on tables from anon, authenticated;

-- ============================================================
-- 끝. 실행 후 브라우저 anon 키로는 documents 조회만 가능하고,
-- feedback / users / document_embeds 는 service_role 로만 접근됩니다.
-- ============================================================

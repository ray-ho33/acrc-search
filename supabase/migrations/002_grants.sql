-- ============================================================
-- 002_grants.sql — API 역할에 테이블 권한 부여
-- ------------------------------------------------------------
-- 001_init.sql 실행 후 ingest/embed 에서
--   "permission denied for table documents"
-- 가 나오면 이 파일을 Supabase SQL Editor에서 Run 하세요.
--
-- 원인: SQL로 만든 테이블에 anon / service_role GRANT가 없을 수 있음
-- ============================================================

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on table public.documents to postgres, service_role;
grant all on table public.document_embeds to postgres, service_role;
grant all on table public.feedback to postgres, service_role;
grant all on table public.users to postgres, service_role;

grant select on table public.documents to anon, authenticated;
grant select on table public.document_embeds to anon, authenticated;
grant select on table public.feedback to anon, authenticated;
grant select on table public.users to anon, authenticated;

grant execute on function public.set_updated_at() to postgres, service_role;

-- 이후 public 에 새로 만드는 테이블에도 기본 권한 적용
alter default privileges in schema public
  grant all on tables to postgres, service_role;

alter default privileges in schema public
  grant select on tables to anon, authenticated;

-- ============================================================
-- 끝. 실행 후 다시:
--   npm run ingest -- --max-pages 2 --skip-download
--   npm run embed -- --limit 50
-- (--skip-download: 이미 .data/acr-ingest 에 JSON 이 있으면 API 재호출 생략)
-- ============================================================

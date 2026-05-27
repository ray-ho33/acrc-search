-- ============================================================
-- 005_restrict_feedback_writes.sql — feedback 쓰기 경로 제한
-- ------------------------------------------------------------
-- M4 환류 입력은 /api/feedback 서버 라우트(service_role)를 통해서만 저장한다.
-- 브라우저에 공개되는 anon/authenticated 역할이 Supabase REST API로
-- feedback INSERT를 직접 호출하지 못하도록 쓰기 권한을 회수한다.
-- ============================================================

revoke insert, update, delete on table public.feedback from anon, authenticated;

grant all on table public.feedback to postgres, service_role;
grant select on table public.feedback to anon, authenticated;

-- ============================================================
-- 끝. 실행 후 앱에서 환류 저장은 가능하고, 브라우저 anon 키로 직접 INSERT는
-- 막히는 상태가 됩니다.
-- ============================================================

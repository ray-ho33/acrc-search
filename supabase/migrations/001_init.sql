-- ============================================================
-- 001_init.sql — 고충처리 자료 검색 지원 시스템 초기 스키마
-- 근거: PRD/02_DATA_MODEL.md §3 (Phase 1 MVP)
-- 실행: Supabase 대시보드 > SQL Editor > New query > 이 파일 통째 붙여넣기 > Run
-- ============================================================

-- 1. 확장 (pgvector: 의미 벡터 저장·코사인 유사도 검색용)
create extension if not exists vector;

-- 2. documents : 자료 한 건 (의결례·유권해석·재결례·판례)
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  source       text not null,                         -- 권익위 / 법제처 / 행심위 / 대법원
  type         text not null,                         -- 의결례 / 유권해석 / 재결례 / 판례
  external_id  text not null unique,                  -- 출처 사이트의 결정번호
  title        text not null,
  agency       text,
  decided_at   date,
  case_no      text,
  summary      text,
  full_text    text,
  url          text,
  tags         text[],
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists documents_source_type_idx
  on public.documents (source, type);

create index if not exists documents_decided_at_idx
  on public.documents (decided_at desc);

-- 3. document_embeds : 임베딩 벡터 (1:1 with documents)
--    임베딩 차원 1536 — PRD/02_DATA_MODEL.md §8 NEEDS CLARIFICATION 결정 시 변경
create table if not exists public.document_embeds (
  document_id  uuid primary key references public.documents(id) on delete cascade,
  model        text not null,
  dimensions   integer not null,
  embedding    vector(1536) not null,
  embedded_at  timestamptz not null default now()
);

-- 벡터 인덱스는 데이터 ≥ 1만 건일 때 추가 (PRD/02_DATA_MODEL.md §3.2)
-- create index document_embeds_embedding_idx
--   on public.document_embeds
--   using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);

-- 4. feedback : 조사관 환류 메모 (MVP는 본인만 보임 / RLS 미적용)
create table if not exists public.feedback (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents(id) on delete cascade,
  user_id      uuid,                                  -- MVP 는 nullable (익명)
  case_no      text,
  helpful      boolean,
  note         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists feedback_document_id_idx
  on public.feedback (document_id);

-- 5. users : Phase 3 활성화 예정. MVP 에서는 빈 테이블만 생성.
create table if not exists public.users (
  id           uuid primary key,
  email        text unique,
  name         text,
  role         text,                                  -- investigator / curator / admin
  department   text,
  created_at   timestamptz not null default now()
);

-- 6. updated_at 자동 갱신 트리거 (documents 만)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

-- ============================================================
-- 끝. 실행 후 Supabase 대시보드 > Table Editor 에서
-- documents / document_embeds / feedback / users 4개 테이블이
-- 보이면 성공입니다.
-- ============================================================

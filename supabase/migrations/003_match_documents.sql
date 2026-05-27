-- ============================================================
-- 003_match_documents.sql — pgvector 검색 RPC 함수
-- ------------------------------------------------------------
-- Supabase SQL Editor에서 실행 후 /api/search 가 이 함수를 호출합니다.
-- ============================================================

create or replace function public.match_documents(
  query_embedding vector(1536),
  match_count integer default 10,
  filter_type text default null,
  filter_year integer default null
)
returns table (
  id uuid,
  title text,
  source text,
  type text,
  agency text,
  decided_at date,
  summary text,
  url text,
  score double precision
)
language sql
stable
as $$
  select
    d.id,
    d.title,
    d.source,
    d.type,
    d.agency,
    d.decided_at,
    d.summary,
    d.url,
    1 - (e.embedding <=> query_embedding) as score
  from public.document_embeds e
  join public.documents d on d.id = e.document_id
  where
    (filter_type is null or d.type = filter_type)
    and (
      filter_year is null
      or (
        d.decided_at is not null
        and extract(year from d.decided_at)::integer = filter_year
      )
    )
  order by e.embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;

grant execute on function public.match_documents(vector, integer, text, integer)
  to postgres, anon, authenticated, service_role;

-- ============================================================
-- 끝. 실행 후 검색 API가 supabase.rpc("match_documents", ...)로 호출합니다.
-- ============================================================

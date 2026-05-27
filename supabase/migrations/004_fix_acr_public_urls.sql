-- ============================================================
-- 004_fix_acr_public_urls.sql — 의결례 원문 링크를 공개 HTML URL로 교정
-- ------------------------------------------------------------
-- 기존 M2 수집 데이터에는 DRF API 주소가 저장되어 있을 수 있습니다.
-- 브라우저에서 사람이 읽는 HTML 페이지가 열리도록 type=HTML 을 붙이고,
-- API 키 노출을 피하기 위해 문서 샘플값인 OC=test 를 사용합니다.
-- ============================================================

update public.documents
set url =
  'https://www.law.go.kr/DRF/lawService.do?OC=test&target=acr&type=HTML&ID='
  || external_id
where
  source = '권익위'
  and type = '의결례'
  and (
    url is null
    or url like 'https://www.law.go.kr/DRF/lawService.do?%'
  );

-- 검색 RPC도 저장된 url 대신 공개 HTML URL을 반환하도록 보강합니다.
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
    case
      when d.source = '권익위' and d.type = '의결례'
        then 'https://www.law.go.kr/DRF/lawService.do?OC=test&target=acr&type=HTML&ID=' || d.external_id
      else d.url
    end as url,
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
-- 끝. 실행 후 검색 결과의 "원문 보기"를 다시 눌러 확인하세요.
-- ============================================================

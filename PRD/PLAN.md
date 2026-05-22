# PLAN.md — 구현 계획서

## 목표 (한 문장)

`PRD/`의 4종 문서(특히 `01_PRD.md` §7 MVP 기능)에 정의된 **고충처리 자료 검색 지원 시스템 Phase 1 MVP**를 Next.js 14 + Supabase(pgvector) + Gemini 임베딩으로 구현하고 Vercel에 배포한다.

## 참조 문서 (반드시 먼저 읽기)

- `PRD/01_PRD.md` — 무엇을 만드는지 (acceptance criteria 10개)
- `PRD/02_DATA_MODEL.md` — DB 스키마 정의
- `PRD/03_PHASES.md` — Phase 1 작업 목록
- `PRD/04_PROJECT_SPEC.md` — 절대 하지 마 / 디렉터리 구조 / 코드 스타일
- `PRD/VALIDATION.md` — 검증 기준
- `PRD/RECOVERY.md` — 실패·중단 시 행동 규칙

## 재사용 자산

- 이전 레포: `https://github.com/ray-ho33/jeob-su`
  - `scripts/lib/acr-download.mjs` → 본 프로젝트의 `scripts/lib/acr-download.mjs`
  - `scripts/lib/gemini-embed.mjs` → 본 프로젝트의 `scripts/lib/gemini-embed.mjs`
  - `scripts/lib/load-env.mjs` → 본 프로젝트의 `scripts/lib/load-env.mjs`
  - `scripts/lib/acr-index-build.mjs` → `scripts/build-embeddings.mjs`로 이름 변경 + DB 저장으로 변경
  - `scripts/lib/acr-semantic-search.mjs` → `lib/search.ts`로 이식 + pgvector SQL로 변경

## 마일스톤 (5개, 순서 고정)

### M1. 프로젝트 부트스트랩 + DB

목적: 빈 페이지라도 뜨고, DB 스키마가 준비됨.

작업:
1. `npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"` (또는 동등한 명령으로 셋업)
2. `package.json`에 `lint`, `typecheck`, `dev`, `build`, `start` 스크립트 정리
3. Supabase 프로젝트 생성 (대시보드)
4. `supabase/migrations/001_init.sql` 작성 — `02_DATA_MODEL.md` §3 스키마 그대로
5. Supabase SQL Editor에서 마이그레이션 실행 → `documents`, `document_embeds`, `feedback` 테이블 생성 + `pgvector` 확장 활성화
6. `lib/db.ts` 작성 — `createServerClient()` / `createBrowserClient()` 두 함수만 export
7. `.env.example` 작성 (`02_DATA_MODEL.md` §6 변수 6종)
8. `.gitignore`에 `.env` 포함 확인
9. `npm run dev` → `localhost:3000` 200 응답 확인

완료 기준: VALIDATION.md M1 모두 ✅

### M2. 자료 수집 + 임베딩 파이프라인

목적: Supabase에 의결례 + 임베딩이 50건 이상 들어감.

작업:
1. 이전 레포에서 `acr-download.mjs`, `gemini-embed.mjs`, `load-env.mjs` 복사 → `scripts/lib/`
2. `scripts/ingest-decisions.mjs` 작성:
   - `acr-download.mjs`로 의결례 JSON 가져오기
   - Supabase `documents`에 INSERT (UPSERT on `external_id` UNIQUE)
   - 옵션: `--max-pages N`, `--from-date YYYY-MM-DD`
3. `scripts/build-embeddings.mjs` 작성:
   - `documents`에서 임베딩 없는 행 가져오기
   - `gemini-embed.mjs`로 `RETRIEVAL_DOCUMENT` 임베딩 호출
   - L2 정규화 후 `document_embeds` UPSERT
   - 옵션: `--limit N`, `--batch-size N`
4. `node scripts/ingest-decisions.mjs --max-pages 2` 실행 → 10건 이상 확인
5. `node scripts/build-embeddings.mjs --limit 50` 실행 → 50건 이상 임베딩 확인

완료 기준: VALIDATION.md M2 모두 ✅

### M3. 검색 API + 검색 UI

목적: 로컬에서 검색이 동작함.

작업:
1. `lib/search.ts` 작성:
   - `searchDocuments(query: string, filters: {...})` 함수
   - 내부에서 쿼리 임베딩 (`RETRIEVAL_QUERY`) → pgvector 코사인 유사도 SQL
2. `app/api/search/route.ts` 작성:
   - POST 핸들러
   - 빈 쿼리 거부, filter 검증
   - 응답에서 `full_text` 제거 (절대 하지 마 §3.3)
3. `components/SearchBar.tsx` 작성
4. `components/ResultCard.tsx` 작성 (출처·결정일·원문 링크 필수)
5. `components/FilterPanel.tsx` 작성 (자료 종류·연도)
6. `app/page.tsx`에 위 컴포넌트 조합
7. Tailwind 인디고 톤 적용 (`indigo-*`, `slate-*` 위주)
8. 로컬 dev에서 검색어 입력 → 카드 ≥ 1건 확인

완료 기준: VALIDATION.md M3 모두 ✅

### M4. 상세 화면 + 환류 입력

목적: 카드 클릭 → 상세 → 환류 메모 저장 흐름 완성.

작업:
1. `app/documents/[id]/page.tsx` 작성 — 전문, 메타데이터, 원문 링크 노출
2. `components/FeedbackForm.tsx` 작성 — `case_no`, `helpful`(👍/👎), `note` 입력
3. `app/api/feedback/route.ts` 작성 — POST 핸들러, 빈 메모 거부, Supabase INSERT
4. Server Component 기본, "use client"는 폼만
5. 로컬에서 카드 클릭 → 상세 이동 → 메모 저장 → Supabase에서 행 확인

완료 기준: VALIDATION.md M4 모두 ✅

### M5. 배포 + 인덱스 확장

목적: 배포 URL에서 의결례 500건 시맨틱 검색 동작.

작업:
1. GitHub 리포지토리 생성 + main 푸시
2. Vercel에 GitHub 연결 + 새 프로젝트 import
3. Vercel 환경변수 등록 — `.env.example`과 1:1 매칭
4. 첫 배포 시 build 성공 확인
5. 의결례 500건 인덱스 확장:
   - `node scripts/ingest-decisions.mjs --max-pages 20` (대략 500건 가정, 실제 페이지당 건수에 맞게 조정)
   - `node scripts/build-embeddings.mjs --limit 500`
6. 배포 URL에서 manual demo:
   - 검색어 5종 입력 ("층간소음", "퇴직금", "공무원 징계" 등)
   - 각각 카드 ≥ 1건, 응답 시간 측정
   - 카드 → 상세 → 원문 링크 클릭 작동
7. P95 응답 시간 ≤ 2초 측정 (10회 측정 평균)
8. `01_PRD.md` §7.2 acceptance criteria 10개 전수 ✅ 표시

완료 기준: VALIDATION.md M5 모두 ✅ + `01_PRD.md` §7.2 모두 ✅

## 최종 완료 기준

- 모든 마일스톤 VALIDATION.md ✅
- `01_PRD.md` §7.2 acceptance criteria 10개 모두 ✅
- API 키가 Git 히스토리에 한 번도 들어가지 않음
- 배포 URL을 누구든 열어 검색해서 의결례를 찾을 수 있음
- PROGRESS.md에 마일스톤 5개 모두 "Done" + 검증 명령 출력 첨부

# PROGRESS.md — 진척 기록

> 골 작업 중 항상 이 파일을 최신으로 유지한다.
> 다음 세션에서 이 파일만 읽어도 어디서 이어 해야 하는지 알 수 있어야 한다.

## 현재 골

고충처리 자료 검색 지원 시스템 Phase 1 MVP 구현 + Vercel 배포

## 현재 마일스톤

**M1. 프로젝트 부트스트랩 + DB** (코드 측면 완료, 사용자 SQL 실행 대기)

학습 모드로 5단계 분할:
- [x] S1. 사전 준비 점검 + PROGRESS 갱신 + git tag `m1-start`
- [x] S2. Next.js 부트스트랩 (Next.js 16 + React 19 + Tailwind v4, 임시 폴더 + 머지 방식)
- [x] S3. 환경변수 (`.env.example`) + `lib/db.ts` (DB 단일 진입점) + `lib/types.ts`
- [x] S4. `supabase/migrations/001_init.sql` 작성 완료 — **사용자가 Supabase SQL Editor 에서 실행 필요**
- [x] S5. `npm run dev` → HTTP 200 확인 + 필수 검증 5종 통과 + 커밋

## 사용자 핸드오프 (M2 시작 전 필수)

1. **`.env` 파일 생성**: `cp .env.example .env` 후 6개 변수 채우기
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — Supabase 대시보드 > Project Settings > API
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 같은 곳
   - `GEMINI_API_KEY`, `KOREAN_LAW_API_KEY`
2. **Supabase SQL 실행**: `supabase/migrations/001_init.sql` 내용을 Supabase 대시보드 > SQL Editor > New query > Run
3. **테이블 4종 생성 확인**: Table Editor 에서 `documents`, `document_embeds`, `feedback`, `users` 표시되는지 눈으로 확인
4. **확인 후 M2 시작 요청**

## 완료된 마일스톤

- M1 (코드): 2026-05-22, 커밋 + tag `m1-code-complete`

## 마지막 검증 (Last Validation)

2026-05-22 (S5)
- `npm run typecheck` ✅ (TypeScript 에러 0)
- `npm run lint` ✅ (ESLint 에러 0)
- `npm run build` ✅ (라우트 `/`, `/_not-found` 정적 생성)
- `npm run dev` → `curl http://localhost:3000/` ✅ HTTP 200
- `.env` 미존재 + `.gitignore` 에 `.env` 포함 ✅
- git history 내 실제 API 키 0건 ✅

## 실패한 시도 (Failed Attempts)

(없음)

## 현재 최선 상태 (Current Best State)

S1 시작. PRD/.gitignore 보존 확정. Next.js 부트스트랩은 `_bootstrap/` 임시 폴더 경유로 진행하여 `PRD/`, `.gitignore`, `.git` 보호.

## 다음 단계 (Next Step)

**M2. 자료 수집 + 임베딩 파이프라인** (사용자 핸드오프 완료 후 시작)

1. 이전 레포(`https://github.com/ray-ho33/jeob-su`)에서 `acr-download.mjs`, `gemini-embed.mjs`, `load-env.mjs` 를 `scripts/lib/` 로 복사
2. `scripts/ingest-decisions.mjs` 작성 — 의결례 수집 → Supabase `documents` UPSERT
3. `scripts/build-embeddings.mjs` 작성 — `RETRIEVAL_DOCUMENT` 임베딩 + L2 정규화 + `document_embeds` UPSERT
4. 검증: `documents` 행 ≥ 10건, `document_embeds` 행 ≥ 50건

## 리스크 (Risks)

- Supabase 무료 티어 데이터 용량 한도 (500MB) — 데이터 500건은 충분히 여유
- Gemini API 호출 한도 — 임베딩 500건 정도면 무료 한도 안에 들어옴
- 이전 레포 코드 이식 시 ESM 구조 충돌 — Next.js는 `.mjs` 직접 못 부르니 `scripts/` 안에서만 사용

## 인수인계 메모 (Handoff Notes)

- 사용자: 프로그래밍 초보자, 한국어/존댓말, 페어 프로그래밍 학습 목적
- 환경변수는 절대 코드에 직접 넣지 말 것. `.env`에서 읽기
- 이전 레포 `https://github.com/ray-ho33/jeob-su`의 스크립트를 적극 재사용
- 디자인은 인디고 톤 (Tailwind `indigo-*` + `slate-*`)

## 골 시작 기록

- 시작 시각: 2026-05-22 (KST)
- 사용 환경: Cursor IDE / Claude Opus 4.7
- 진행 방식: 마일스톤별 사용자 확인 (페어 프로그래밍 학습 모드)
- 컴팩트 후 `goal-command.md` 본문 길이: 2,378자 / 4,000자 한도
- 사전 준비 대기 항목 (M1 시작 전 사용자가 직접 발급):
  - [x] Supabase 프로젝트 생성 + URL, ANON_KEY, SERVICE_KEY 발급
  - [x] Google AI Studio에서 `GEMINI_API_KEY` 발급
  - [x] 법제처 Open API 신청해서 `KOREAN_LAW_API_KEY` 또는 `LAW_OC` 발급
  - [x] GitHub 빈 레포지토리 생성
  - [x] Vercel 계정 (M5에서 사용)
  - 사용자 확인: 2026-05-22, 5종 모두 완료

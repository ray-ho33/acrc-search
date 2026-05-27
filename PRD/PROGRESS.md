# PROGRESS.md — 진척 기록

> 골 작업 중 항상 이 파일을 최신으로 유지한다.
> 다음 세션에서 이 파일만 읽어도 어디서 이어 해야 하는지 알 수 있어야 한다.

## 현재 골

고충처리 자료 검색 지원 시스템 Phase 1 MVP 구현 + Vercel 배포

## 현재 마일스톤

**M5. 배포 + 인덱스 확장** (완료)

- [x] 로컬 품질 검증 (`test` / `typecheck` / `lint` / `build`)
- [x] Git·보안·Supabase 배포 전 점검
- [x] `PRD/M5_DEPLOY_CHECKLIST.md` 작성
- [x] GitHub `main` push (`51a8270`)
- [x] Vercel Import + Production 환경변수 + 첫 배포
- [x] ingest/embed 500건 확장
- [x] 배포 URL smoke test + P95 응답 시간 측정

## 완료된 마일스톤

- M1 (코드): 2026-05-22, 커밋 + tag `m1-code-complete`
- M2 (파이프라인): 2026-05-22, 사용자 검증 완료
  - `ingest` + `embed` 성공, `documents` / `document_embeds` 적재 확인
  - `service_role` 키 교정, `002_grants.sql`, `parseDecidedAt` 잘못된 날짜 처리
- M3 (검색 API + UI): 2026-05-23, 사용자 검증 완료
  - 의미 기반 검색 API/UI 구현
  - 결과 카드에서 내부 상세 페이지(`/documents/[id]`)의 저장 원문 열기 확인
- M4 (환류 입력): 2026-05-24, 코드 + 수동 검증 완료
  - `POST /api/feedback`, `FeedbackForm`, `005_restrict_feedback_writes.sql`

## 마지막 검증 (Last Validation)

2026-05-27 (M5 — Vercel Production 배포 + 배포 URL smoke test)
- Production URL: `https://acrc-search.vercel.app/`
- Vercel Import + 환경변수 6종 등록 + Deploy ✅
- 배포 커밋: `3d8421f` (`docs: record local smoke test`) ✅
- 홈(`/`) 200 ✅
- 빈 검색어 `POST /api/search` 400 + `EMPTY_QUERY` ✅
- 검색어 `층간소음` `POST /api/search` 200 + 결과 3건 ✅
- 상세 페이지 `/documents/11c155f5-9c7b-4332-ab53-1731317e65b0` 200 ✅
- 환류 저장 `POST /api/feedback` 201 ✅ (`feedback` 테스트 행 `6e153f6f-ac4e-4640-b82d-bf3f7751a990`)
- 검색 응답 시간 10회: 최장 약 1.64초, P95 대략 2초 이하 ✅
- 배포 홈 HTML에서 `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `KOREAN_LAW_API_KEY` 문자열 노출 없음 ✅
- Supabase 행 수: `documents` 640, `document_embeds` 575, `feedback` 3

2026-05-27 (M5 — GitHub push + 인덱스 확장)
- `git push origin main` ✅ (`main -> origin/main`, latest `3d8421f`)
- `npm run ingest -- --max-pages 20` ✅
- `npm run embed -- --limit 500` ✅ (성공 500, 스킵 0, 오류 0)
- `npm run check:db` ✅ (`service_role`, documents 640건)
- Supabase 행 수: `documents` 640, `document_embeds` 575, `feedback` 1
- Vercel CLI/프로젝트 연결: 로컬에 없음 (`vercel` 없음, `.vercel` 없음)

2026-05-27 (M5 — 로컬 smoke test)
- `npm run dev` ✅ (`http://localhost:3000`)
- 홈(`/`) 200 ✅
- 빈 검색어 `POST /api/search` 400 + `EMPTY_QUERY` ✅
- 검색어 `층간소음` `POST /api/search` 200 + 결과 3건 ✅
- 상세 페이지 `/documents/11c155f5-9c7b-4332-ab53-1731317e65b0` 200 ✅
- 환류 저장 `POST /api/feedback` 201 ✅ (`feedback` 테스트 행 `5ee25048-e1a6-453e-bb4b-2105d6ee72cc`)
- Supabase 행 수: `documents` 640, `document_embeds` 575, `feedback` 2

2026-05-24 (M5 — 배포 전 준비)
- `npm test` ✅ (4 passed)
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run build` ✅
- `.env` / `.vercel` → `.gitignore` ✅
- Git: `main`, `origin` = `ray-ho33/acrc-search` ✅
- Git 히스토리 API 키 패턴 스캔 ✅
- `npm run check:db` ✅ (`service_role`, documents 200건)
- Supabase 행 수: `documents` 200, `document_embeds` 75, `feedback` 1
- `anon` → `feedback` 직접 INSERT 차단 ✅

2026-05-24 (M4 — 수동 검증)
- 환류 저장 UI + DB 행 확인 ✅

## 실패한 시도 (Failed Attempts)

- M2: `SUPABASE_SERVICE_KEY`에 anon 키 입력 → `permission denied` (service_role 로 교정)
- M2: 결정일 `2023-06-00` → `parseDecidedAt` 에서 null 처리로 해결
- M3: 원문 링크가 DRF API 주소로 열림 → 앱 내부 `/documents/[id]` 저장 원문 페이지로 전환

## 현재 최선 상태 (Current Best State)

M5 **Vercel Production 배포 + 배포 URL smoke test**까지 완료.
Production URL은 `https://acrc-search.vercel.app/`.
데이터는 M5 목표(500건)를 넘김 (`documents` 640, `document_embeds` 575).

## 다음 단계 (Next Step)

**M5 완료 후 정리**

1. 테스트용 `feedback` 행 정리 여부 결정 (`local-smoke-test`, `prod-smoke-test`)
2. 다음 마일스톤 범위 결정 (예: 검색 품질 개선, 관리자 화면, 인증)

## 리스크 (Risks)

- 테스트용 `feedback` 행 2건이 DB에 남아 있음
- `SUPABASE_SERVICE_KEY`를 `NEXT_PUBLIC_` 변수에 넣으면 안 됨 (현재는 서버 전용 변수로 등록)
- Supabase 무료 티어 / Gemini API 한도 — 추가 확장 시 모니터링

## 인수인계 메모 (Handoff Notes)

- 사용자: 프로그래밍 초보자, 한국어/존댓말, 페어 프로그래밍 학습 목적
- 환경변수는 절대 코드에 직접 넣지 말 것. `.env` / Vercel Env만 사용
- M5 배포 방식: **Vercel 웹 대시보드(A안)** 로 완료
- 디자인: 인디고 톤 (`indigo-*` + `slate-*`)

## 골 시작 기록

- 시작 시각: 2026-05-22 (KST)
- 사전 준비: Supabase, Gemini, 법제처 API, GitHub, Vercel 계정 ✅

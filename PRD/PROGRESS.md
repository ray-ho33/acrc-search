# PROGRESS.md — 진척 기록

> 골 작업 중 항상 이 파일을 최신으로 유지한다.
> 다음 세션에서 이 파일만 읽어도 어디서 이어 해야 하는지 알 수 있어야 한다.

## 현재 골

고충처리 자료 검색 지원 시스템 Phase 1 MVP 구현 + Vercel 배포

## 현재 마일스톤

**M5. 배포 + 인덱스 확장** (GitHub push + 500건 인덱스 확장 완료, 실제 Vercel 배포 대기)

- [x] 로컬 품질 검증 (`test` / `typecheck` / `lint` / `build`)
- [x] Git·보안·Supabase 배포 전 점검
- [x] `PRD/M5_DEPLOY_CHECKLIST.md` 작성
- [x] GitHub `main` push (`51a8270`)
- [ ] Vercel Import + Production 환경변수 + 첫 배포
- [x] ingest/embed 500건 확장
- [ ] 배포 URL smoke test + P95 응답 시간 측정

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

2026-05-27 (M5 — GitHub push + 인덱스 확장)
- `git push origin main` ✅ (`main -> origin/main`, latest `51a8270`)
- `npm run ingest -- --max-pages 20` ✅
- `npm run embed -- --limit 500` ✅ (성공 500, 스킵 0, 오류 0)
- `npm run check:db` ✅ (`service_role`, documents 640건)
- Supabase 행 수: `documents` 640, `document_embeds` 575, `feedback` 1
- Vercel CLI/프로젝트 연결: 로컬에 없음 (`vercel` 없음, `.vercel` 없음)

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

M5 **GitHub push + 500건 인덱스 확장**까지 완료. 로컬 빌드·보안·DB 점검 통과.
데이터는 M5 목표(500건)를 넘김 (`documents` 640, `document_embeds` 575).
실제 Vercel 배포는 아직 대기 중이며, 로컬에 Vercel CLI/프로젝트 연결 정보가 없음.

## 다음 단계 (Next Step)

**M5 실제 배포** — [`PRD/M5_DEPLOY_CHECKLIST.md`](./M5_DEPLOY_CHECKLIST.md)

1. Vercel 대시보드에서 repo Import
2. Production 환경변수 6종 등록 (`.env.example` 기준)
3. 첫 Production 배포
4. 배포 URL smoke test
5. `PRD/PROGRESS.md`에 배포 URL과 검증 결과 기록

## 리스크 (Risks)

- Vercel 환경변수 누락/오타 시 검색 API가 런타임 500을 낼 수 있음
- `SUPABASE_SERVICE_KEY`를 `NEXT_PUBLIC_` 변수에 넣으면 안 됨
- Supabase 무료 티어 / Gemini API 한도 — 추가 확장 시 모니터링

## 인수인계 메모 (Handoff Notes)

- 사용자: 프로그래밍 초보자, 한국어/존댓말, 페어 프로그래밍 학습 목적
- 환경변수는 절대 코드에 직접 넣지 말 것. `.env` / Vercel Env만 사용
- M5 배포 방식: **Vercel 웹 대시보드(A안)** 권장 (사용자 선택: 오늘은 prep_only)
- 디자인: 인디고 톤 (`indigo-*` + `slate-*`)

## 골 시작 기록

- 시작 시각: 2026-05-22 (KST)
- 사전 준비: Supabase, Gemini, 법제처 API, GitHub, Vercel 계정 ✅

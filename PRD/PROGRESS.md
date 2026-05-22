# PROGRESS.md — 진척 기록

> 골 작업 중 항상 이 파일을 최신으로 유지한다.
> 다음 세션에서 이 파일만 읽어도 어디서 이어 해야 하는지 알 수 있어야 한다.

## 현재 골

고충처리 자료 검색 지원 시스템 Phase 1 MVP 구현 + Vercel 배포

## 현재 마일스톤

**M1. 프로젝트 부트스트랩 + DB** (진행 중, 2026-05-22 시작)

학습 모드로 5단계 분할:
- [x] S1. 사전 준비 점검 + PROGRESS 갱신 + git tag
- [ ] S2. Next.js 부트스트랩 (임시 폴더 + 머지 방식)
- [ ] S3. 환경변수 + `lib/db.ts` (DB 단일 진입점)
- [ ] S4. `supabase/migrations/001_init.sql` 작성 + 사용자가 SQL Editor에서 실행
- [ ] S5. `npm run dev` 확인 + VALIDATION.md M1 체크박스 7종 통과 + 커밋

## 완료된 마일스톤

(없음)

## 마지막 검증 (Last Validation)

(없음 — S5에서 실행 예정)

## 실패한 시도 (Failed Attempts)

(없음)

## 현재 최선 상태 (Current Best State)

S1 시작. PRD/.gitignore 보존 확정. Next.js 부트스트랩은 `_bootstrap/` 임시 폴더 경유로 진행하여 `PRD/`, `.gitignore`, `.git` 보호.

## 다음 단계 (Next Step)

S2 진입:
1. `_bootstrap/` 임시 폴더에 `npx create-next-app@latest` 실행 (TypeScript + Tailwind + App Router)
2. 생성 결과에서 `PRD/`, `.gitignore`를 제외한 파일만 루트로 머지
3. `package.json`의 scripts에 `typecheck` 추가 확인

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

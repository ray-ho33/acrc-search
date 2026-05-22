# 골 검토 요약 — 고충처리 자료 검색 지원 시스템 (Phase 1 MVP)

## 목표 한 문장

`PRD/01_PRD.md`의 acceptance criteria 10개를 모두 만족하는 **의결례 시맨틱 검색 웹앱**을 Next.js 14 + Supabase(pgvector) + Gemini 임베딩으로 만들고 Vercel에 배포한다.

## 마일스톤 (5개, 순서 고정)

1. **M1 부트스트랩** — Next.js + TS + Tailwind 셋업, Supabase 프로젝트 + 3개 테이블(`documents`/`document_embeds`/`feedback`) + pgvector, `lib/db.ts` 격리, `.env.example`.
   - 완료 조건: `npm run build` 통과 + 빈 페이지가 `localhost:3000`에서 200 응답

2. **M2 자료 파이프라인** — 이전 레포 `jeob-su`의 `acr-download.mjs`/`gemini-embed.mjs`/`load-env.mjs`를 `scripts/lib/`에 이식. `scripts/ingest-decisions.mjs` + `scripts/build-embeddings.mjs` 작성.
   - 완료 조건: Supabase `documents` ≥ 50건 + `document_embeds` ≥ 50건

3. **M3 검색 API + UI** — `lib/search.ts`(쿼리 임베딩 + pgvector 코사인), `app/api/search/route.ts`, `SearchBar`/`ResultCard`/`FilterPanel` 컴포넌트. Tailwind 인디고 톤.
   - 완료 조건: 로컬에서 의결례 키워드 → 카드 ≥ 1건 표시

4. **M4 상세 + 환류** — `app/documents/[id]/page.tsx`, `FeedbackForm`, `app/api/feedback/route.ts`.
   - 완료 조건: 카드 클릭 → 상세 → 메모 저장 → DB 행 확인

5. **M5 배포 + 확장** — GitHub 푸시 → Vercel 연결 → 환경변수 등록 → 의결례 500건 이상 인덱스 → manual demo.
   - 완료 조건: 배포 URL에서 검색 5종 동작 + P95 응답 시간 ≤ 2초

## 필수 검증 명령

- `npm run build` (Next.js 빌드)
- `npm run typecheck` (= `tsc --noEmit`)
- `npm run lint` (ESLint)
- `node scripts/ingest-decisions.mjs --max-pages 2` (수집 테스트)
- `node scripts/build-embeddings.mjs --limit 50` (임베딩 테스트)
- 배포 URL에서 manual demo (5종 검색어)

## scope 잠금 / Non-goals

다음은 이번 골에서 절대 추가하지 않는다. 사용자가 "조금만 추가하자"고 해도 거절.

- 자료 4종 통합 (유권해석/재결례/판례) — Phase 2
- AI 요약·하이라이트 — Phase 3
- 사용자 인증·로그인 — Phase 3
- 관리자 메뉴 — Phase 3
- 즐겨찾기·검색 로그 — Phase 2
- 모바일 네이티브 앱
- ISMS / PIA / 망분리 — Phase 4

## 사람 결정이 남은 항목 (NEEDS CLARIFICATION)

PRD에 명시된 것 외에 추가:

- Supabase 프로젝트 생성과 환경변수 발급은 **사용자가 직접 대시보드에서** 수행해야 함 (AI 어시스턴트가 사용자 대신 Supabase 계정에 로그인할 수 없음)
- Vercel 배포도 같음 — 사용자가 GitHub 연결 + 환경변수 등록을 직접 수행
- 법제처 Open API 키도 사용자가 직접 발급

(이 단계들은 AI가 가이드만 제공하고, 사용자가 클릭/입력으로 완료)

## 시작 직전 확인

- `goal-command.md`: **2,378자** / 4,000자 한도 ✅
- PROTECTED_CLAUSES 5종 (정지조건/scope잠금/3회룰/문서참조/PROGRESS업데이트): 모두 통과 ✅
- 영어 헤딩 잔존: 0건 ✅
- 생성된 파일 (PRD/ 폴더):
  - `01_PRD.md` (PRD 본문)
  - `02_DATA_MODEL.md` (스키마)
  - `03_PHASES.md` (Phase 분리)
  - `04_PROJECT_SPEC.md` ("절대 하지 마")
  - `VALIDATION.md` (검증 계약서)
  - `RECOVERY.md` (복구 계약서)
  - `PLAN.md` (구현 계획)
  - `PROGRESS.md` (진척 기록, 빈 템플릿)
  - `goal-command.md` (골 실행 본문)
  - `GOAL_BRIEF.md` (이 문서)
  - `README.md` (네비게이션)

## 다음 단계

이 GOAL_BRIEF를 검토하신 뒤:

- **승인** → 곧바로 M1(프로젝트 부트스트랩)부터 시작
- **수정 필요** → 어느 파일/어느 부분을 어떻게 바꿀지 알려주세요
- **나중에** → 파일만 생성된 채로 두고 종료

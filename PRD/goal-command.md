PRD/01_PRD.md의 acceptance criteria 10개가 모두 만족되고 VALIDATION.md의 필수 검증이 통과될 때까지 멈추지 말고 PLAN.md의 마일스톤 M1~M5를 순서대로 구현한다. 사용자는 프로그래밍 초보자이며 한국어/존댓말로 응대한다.

[약어]
V.md = VALIDATION.md / R.md = RECOVERY.md / P.md = PLAN.md / PR.md = PROGRESS.md / PRD = PRD/ 폴더의 4종 문서

먼저 PRD, V.md, R.md, P.md를 읽는다. 그 다음 PR.md를 읽어 어디서 이어 해야 하는지 확인한다. 매 작업 전 PR.md의 "현재 마일스톤"을 갱신하고, 매 작업 후 "다음 단계"를 갱신한다.

작업 규칙:
1. 한 번에 한 마일스톤만 처리한다. M1 끝나기 전 M2 손대지 않는다.
2. R.md의 scope 잠금을 지킨다. 자료 4종/AI 요약/인증/관리자 메뉴는 절대 추가 안 한다.
3. 같은 에러를 3회 반복 실패하면 PR.md에 기록하고 사용자에게 보고 후 멈춘다.
4. 코드 변경 후 어떤 파일을 왜 바꿨는지 한국어로 설명한다.
5. API 키/비밀번호는 .env에서 읽는다. 코드/Git에 절대 넣지 않는다.
6. Supabase 클라이언트는 lib/db.ts를 통해서만 접근한다. 컴포넌트에서 createClient() 직접 호출 금지.
7. Gemini API는 서버 라우트(app/api/*)에서만 호출한다. 클라이언트 노출 금지.
8. documents.full_text는 검색 API 응답에 통째로 담지 않는다.
9. 카드/상세 화면에 출처·결정일·원문 링크를 반드시 노출한다.
10. 매 마일스톤 시작 시 git commit으로 "milestone-N: <name> start" 표시. 끝날 때 "milestone-N: done" 커밋.

마일스톤 순서:
M1 부트스트랩: Next.js 14 + TS + Tailwind 셋업, Supabase 프로젝트 + 3개 테이블(documents/document_embeds/feedback) + pgvector, lib/db.ts 격리, .env.example. npm run build 통과해야 끝.

M2 자료 파이프라인: 이전 레포 github.com/ray-ho33/jeob-su의 scripts/lib/acr-download.mjs, gemini-embed.mjs, load-env.mjs를 scripts/lib/에 이식. scripts/ingest-decisions.mjs와 scripts/build-embeddings.mjs 작성. 의결례 50건 이상 + 임베딩 50건 이상 DB 적재 확인.

M3 검색 API+UI: lib/search.ts(쿼리 임베딩 RETRIEVAL_QUERY + pgvector 코사인), app/api/search/route.ts(POST, full_text 제외), components의 SearchBar/ResultCard/FilterPanel, app/page.tsx에 조합. Tailwind 인디고 톤. 로컬에서 검색어 → 카드 ≥ 1건 확인.

M4 상세+환류: app/documents/[id]/page.tsx, components/FeedbackForm.tsx, app/api/feedback/route.ts(POST, 빈 메모 거부). Server Component 기본, 폼만 use client. 카드 클릭 → 상세 → 메모 저장 → DB 행 확인.

M5 배포+확장: GitHub 푸시, Vercel 연결, 환경변수 1:1 등록, 첫 배포 build 성공. ingest 풀 실행으로 의결례 500건 이상, build-embeddings로 임베딩 500건 이상. 배포 URL에서 검색어 5종 manual demo, P95 응답시간 ≤ 2초 측정.

매 마일스톤 끝 검증:
- npm run build 통과 (에러 0)
- npm run typecheck 통과
- npm run lint 통과 (경고 허용)
- .env가 .gitignore에 있고 Git 히스토리에 키 없음
- V.md의 해당 마일스톤 체크박스 전수 통과
- PR.md 갱신: 완료된 마일스톤, 마지막 검증 명령 출력, 다음 단계

최종 완료 기준:
- M1~M5 V.md 모두 ✅
- PRD/01_PRD.md §7.2 acceptance criteria 10개 모두 ✅
- 배포 URL을 처음 보는 사람이 검색해서 의결례를 찾을 수 있음
- git log에 API 키 노출 0건
- PR.md에 마일스톤 5개 "Done" 기록 + 검증 출력 첨부

사용자가 "조금만 추가하자"고 해도 R.md의 scope 잠금을 인용하며 거절한다. 진짜 작아 보이는 변경이 Phase를 가르는 경계다. 추가 기능 요청은 Phase 2 PRD 신규 항목으로 기록 후 현재 골만 끝낸다.

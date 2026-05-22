# VALIDATION.md — 검증 계약서

> 어떤 상태가 "완료"인지 결정론적으로 정의한다.
> 추측·자가평가 금지. 명령·산출물·체크박스로만 판정한다.

## 필수 검증 (전 마일스톤 공통)

다음은 어떤 마일스톤도 끝났다고 주장하기 전 반드시 통과해야 한다.

- [ ] `npm run build` 성공 (Next.js 빌드 에러 0건)
- [ ] `npm run typecheck` (= `tsc --noEmit`) 성공 (TypeScript 에러 0건)
- [ ] `npm run lint` 성공 (ESLint 에러 0건, 경고는 허용)
- [ ] `.env`가 `.gitignore`에 포함되어 있고 Git에 커밋되지 않음
- [ ] `git log -p | grep -E "(GEMINI_API_KEY|SUPABASE_SERVICE_KEY|KOREAN_LAW_API_KEY|LAW_OC).*=.*[A-Za-z0-9]" || echo "OK"` 결과가 `OK` (API 키가 히스토리에 없음)

## 마일스톤별 검증

### M1. 프로젝트 부트스트랩 + DB

- [ ] 디렉터리 구조가 `04_PROJECT_SPEC.md` §2와 일치 (`app/`, `lib/`, `components/`, `scripts/`, `supabase/migrations/`)
- [ ] `npm run dev` 실행 시 `http://localhost:3000`에 빈 페이지(또는 placeholder)가 200으로 응답
- [ ] Supabase 프로젝트에 `documents`, `document_embeds`, `feedback` 테이블 생성 완료
- [ ] `documents.id`, `document_embeds.embedding(vector)`, `feedback.id` 컬럼이 `02_DATA_MODEL.md` 정의와 일치
- [ ] `supabase/migrations/001_init.sql`이 위 스키마를 모두 포함
- [ ] `lib/db.ts`가 Supabase 클라이언트의 유일한 진입점이며, 컴포넌트가 직접 `createClient()`를 호출하지 않음
- [ ] `.env.example`에 `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `KOREAN_LAW_API_KEY` 모두 등록 (값 없음)

### M2. 자료 수집 + 임베딩 파이프라인

- [ ] `scripts/lib/acr-download.mjs`가 이전 레포에서 이식되어 동작
- [ ] `scripts/lib/gemini-embed.mjs`가 이식되어 `RETRIEVAL_DOCUMENT`/`RETRIEVAL_QUERY` 분기 보존
- [ ] `node scripts/ingest-decisions.mjs --max-pages 2` 실행 후 `documents` 행 ≥ 10건
- [ ] `node scripts/build-embeddings.mjs --limit 50` 실행 후 `document_embeds` 행 ≥ 50건
- [ ] `document_embeds.embedding`은 L2 정규화된 벡터 (랜덤 1건 길이 ≈ 1.0)
- [ ] 임베딩 모델/차원이 `02_DATA_MODEL.md`와 일치

### M3. 검색 API + 검색 UI

- [ ] `POST /api/search` 라우트 존재, 요청 본문 `{ q: string, filters?: {...} }`
- [ ] 응답 형식 `{ results: [{ id, title, source, type, agency, decided_at, summary, score }] }` (전문 미포함)
- [ ] 쿼리 임베딩이 `RETRIEVAL_QUERY`로 호출됨 (코드 grep으로 확인)
- [ ] pgvector 코사인 유사도 `<=>` 또는 `<#>` 사용
- [ ] 메인 페이지에 검색창, 결과 카드 리스트, 필터 패널 렌더링
- [ ] 카드에 출처·결정일·원문 링크 노출 (라이선스 표기 의무)
- [ ] 로컬 dev에서 "층간소음" 또는 임의 의결례 키워드 → 카드 ≥ 1건

### M4. 상세 화면 + 환류 입력

- [ ] `/documents/[id]` 페이지가 동적 라우팅으로 동작
- [ ] 상세 화면에 전문, 메타데이터, 원문 링크, 환류 입력 폼 표시
- [ ] `POST /api/feedback` 라우트 존재, 본문 검증(빈 메모 거부)
- [ ] 환류 메모 저장 후 `feedback` 테이블에 행 추가 확인 (Supabase Studio 또는 SQL)
- [ ] 카드 클릭 → 상세 이동 → 메모 저장 흐름이 한 번에 완주

### M5. 배포 + 인덱스 확장

- [ ] Vercel 프로젝트 생성 + main 브랜치 자동 배포
- [ ] Vercel 환경변수에 `.env.example`과 1:1 매칭으로 모두 등록
- [ ] 배포 URL이 200으로 응답
- [ ] `documents` 행 ≥ 500건, `document_embeds` 행 ≥ 500건
- [ ] 배포 URL에서 manual demo 통과 — 검색 → 카드 ≥ 5건 → 카드 클릭 → 상세 → 원문 링크 클릭
- [ ] 검색 응답 시간 P95 ≤ 2초 (배포 URL에서 10회 측정 평균)
- [ ] `01_PRD.md` §7.2의 acceptance criteria 10개 전수 ✅

## 완료 기준 매핑 (Acceptance Criteria → 마일스톤)

| `01_PRD.md` §7.2 | 충족 마일스톤 |
|------------------|--------------|
| 빈 검색어 안내 메시지 | M3 |
| 결과 카드 제목·기관·결정일·유사도·미리보기 | M3 |
| 코사인 유사도 내림차순 정렬 | M3 |
| 카드 클릭 → 상세 + 원문 링크 | M4 |
| 자료 종류·연도 필터 즉시 갱신 | M3 |
| 응답 시간 P95 ≤ 2초 | M5 |
| 환경변수 6종 동작 | M1, M5 |
| 환경변수 누락 시 명확한 오류 | M1 |
| API 키 Git 비포함 | 전 마일스톤 (필수 검증) |
| Vercel 배포 URL 동작 | M5 |

## 완료로 보지 않는 조건 (Not Done If)

다음 중 하나라도 해당되면 "완료"가 아니다.

- `npm run build`가 경고 외 에러를 출력함
- `.env` 또는 키 값이 Git 히스토리에 한 번이라도 들어감
- `documents.full_text`가 검색 API 응답에 포함됨 (3.3 절대 하지 마 위반)
- Supabase Service Key가 클라이언트 번들에 포함됨 (개발자 도구 Network 탭에 노출됨)
- 자료 카드/상세에 출처·원문 링크가 표시되지 않음
- 배포 URL이 500/타임아웃으로 응답
- AI가 "구현 완료했습니다"라고 보고했지만 사용자가 직접 검색해보지 않음

# M5 배포 전 준비 + Vercel 대시보드 배포 체크리스트

> 목적: **실제 Vercel 배포**를 누르기 전에 로컬·Git·Supabase 상태를 점검하고,  
> Vercel 웹 대시보드에서 따라 할 단계를 한곳에 모아 둡니다.  
> (2026-05-27 기준 Vercel Production 배포 + smoke test 완료)

## 0. 배포 전 준비 결과 (자동 점검 요약)

| 항목 | 결과 |
|------|------|
| `npm test` | ✅ 4 tests passed |
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ |
| `npm run build` | ✅ (`/`, `/api/search`, `/api/feedback`, `/documents/[id]`) |
| `.env` / `.vercel` Git 제외 | ✅ `.gitignore`에 등록됨 |
| Git 브랜치 | `main` |
| Git 원격 | `https://github.com/ray-ho33/acrc-search.git` |
| GitHub push | ✅ `main -> origin/main`, latest `3d8421f` |
| Git 히스토리 키 노출 | ✅ 의심 패턴 없음 |
| `.env.example` | ✅ 값 비어 있음 (예시만) |
| Supabase `service_role` | ✅ (`npm run check:db`) |
| `documents` 행 수 | **640** (M5 목표 500건 달성) |
| `document_embeds` 행 수 | **575** (M5 목표 500건 달성) |
| `feedback` anon 직접 INSERT | ✅ RLS/권한으로 차단됨 |
| Vercel Production URL | ✅ `https://acrc-search.vercel.app/` |
| 배포 URL smoke test | ✅ 홈/검색/상세/환류/빈 검색어 통과 |
| 검색 응답 시간 | ✅ 10회 최장 약 1.64초, P95 대략 2초 이하 |

**아직 안 한 것 / 선택 정리:**

- 테스트용 `feedback` 행 정리 여부 결정 (`local-smoke-test`, `prod-smoke-test`)

---

## 1. 배포 전에 Git에 올릴 변경사항 정리

완료: `main` 변경사항은 GitHub `origin/main`에 push됨 (`51a8270`).
Vercel은 GitHub `main`을 기준으로 빌드할 수 있는 상태입니다.

대표 포함 파일:

- `app/`, `components/`, `lib/` (M3 검색, M4 환류)
- `scripts/` (M2 ingest/embed)
- `supabase/migrations/002` ~ `005`
- `tests/`, `package.json`, `PRD/` 문서

이미 실행한 명령:

```bash
git add .
git status   # .env 가 목록에 없는지 반드시 확인
git commit -m "feat: add search feedback and deploy prep"
git push origin main
```

주의: `git status`에 `.env`가 보이면 **절대 커밋하지 마세요.**

---

## 2. Supabase 마이그레이션 최종 확인

Supabase **SQL Editor**에서 아래 파일을 **이미 실행했는지** 확인하세요.  
안 했다면 순서대로 Run 합니다.

| 순서 | 파일 | 용도 |
|------|------|------|
| 1 | `supabase/migrations/001_init.sql` | 테이블 4개 + pgvector |
| 2 | `supabase/migrations/002_grants.sql` | role별 GRANT |
| 3 | `supabase/migrations/003_match_documents.sql` | 검색 RPC `match_documents` |
| 4 | `supabase/migrations/004_fix_acr_public_urls.sql` | (선택) URL 정리 — 내부 상세 페이지 사용 중이면 필수는 아님 |
| 5 | `supabase/migrations/005_restrict_feedback_writes.sql` | `feedback` anon 직접 쓰기 차단 |

로컬에서 빠르게 확인:

```bash
npm run check:db
```

Table Editor에서 `documents` ≥ 1, `document_embeds` ≥ 1 이면 검색 데모는 가능합니다.
현재는 `documents` 640, `document_embeds` 575로 **M5 데이터 기준(500건)** 을 달성했습니다.

---

## 3. Vercel 대시보드 — 프로젝트 연결 (A안)

완료: `ray-ho33/acrc-search`를 Vercel 프로젝트 `acrc-search`로 Import.
Production URL: `https://acrc-search.vercel.app/`

1. [vercel.com](https://vercel.com) 로그인
2. **Add New…** → **Project**
3. **Import Git Repository** → `ray-ho33/acrc-search` 선택
4. Framework Preset: **Next.js** (자동 감지되면 그대로)
5. Root Directory: `./` (기본값)
6. Build Command: `npm run build` (기본값)
7. Output: Next.js 기본 (변경 불필요)

**아직 Deploy 버튼을 누르기 전에** 4절 환경변수를 먼저 넣는 것을 권장합니다.

---

## 4. Vercel 환경변수 등록 (Production)

완료: 아래 6개 환경변수를 Production and Preview에 등록.

Vercel 프로젝트 → **Settings** → **Environment Variables**

로컬 `.env`와 **이름이 1:1**로 맞아야 합니다. 값은 Supabase / Google AI Studio / 법제처에서 복사합니다.

| 변수 | Vercel에 넣을 환경 | 비밀 여부 | 설명 |
|------|-------------------|-----------|------|
| `SUPABASE_URL` | Production (+ Preview 권장) | 비밀 | Supabase API URL |
| `SUPABASE_SERVICE_KEY` | Production (+ Preview 권장) | **절대 공개 금지** | `service_role` (secret) |
| `NEXT_PUBLIC_SUPABASE_URL` | Production (+ Preview) | 공개 가능 | 보통 `SUPABASE_URL`과 동일 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production (+ Preview) | 공개 가능 | `anon` public key |
| `GEMINI_API_KEY` | Production (+ Preview) | **절대 공개 금지** | 검색 쿼리 임베딩 |
| `KOREAN_LAW_API_KEY` | Production (+ Preview) | **절대 공개 금지** | (로컬 ingest용; 앱 런타임 검색에는 필수 아님) |
| `LAW_OC` | 선택 | 비밀 | `KOREAN_LAW_API_KEY`와 같게 넣어도 됨 |

체크리스트:

- [x] `SUPABASE_SERVICE_KEY`가 `anon` 키가 **아님**
- [x] `NEXT_PUBLIC_` 변수에 `SERVICE_KEY`를 넣지 **않음**
- [x] Production에 6개 등록 완료
- [x] 환경변수 저장 후 Deploy 완료

---

## 5. 첫 Production 배포

완료: `3d8421f` 커밋 기준 Production 배포 완료.

1. 환경변수 저장
2. **Deployments** → **Redeploy** (또는 Import 직후 첫 Deploy)
3. 빌드 로그에서 `npm run build` 성공 확인
4. 배포 URL 복사 (예: `https://acrc-search-xxx.vercel.app`)

실패 시 자주 나는 원인:

| 증상 | 확인 |
|------|------|
| Build 실패 `env` | Vercel 환경변수 이름 오타 |
| Runtime 500 on search | `GEMINI_API_KEY`, `SUPABASE_SERVICE_KEY` 누락 |
| 검색 결과 0건 | `document_embeds` 행 수 부족 (75건이면 일부만 검색됨) |
| 환류 저장 실패 | `005_restrict_feedback_writes.sql` 적용 + API는 `service_role` 사용 |

---

## 6. 인덱스 500건 확장 (M5 데이터 목표)

완료: 배포 URL 데모 전에 **로컬 터미널**에서 실행했습니다 (Vercel 빌드와 무관).

```bash
# 의결례 수집 → documents (대략 500건 목표)
npm run ingest -- --max-pages 20

# 임베딩 → document_embeds
npm run embed -- --limit 500
```

완료 후 Supabase Table Editor 또는:

```bash
npm run check:db
```

현재: `documents` **640**, `document_embeds` **575**

---

## 7. 배포 후 Smoke Test (수동)

배포 URL에서 아래를 순서대로 확인합니다.

- [x] 홈(`/`) 200, 검색 UI 표시
- [x] 검색어 `층간소음` → 결과 3건
- [x] **저장 원문 보기** → `/documents/11c155f5-9c7b-4332-ab53-1731317e65b0` 200
- [x] 환류 입력 → 저장 → Supabase `feedback`에 행 추가 (`6e153f6f-ac4e-4640-b82d-bf3f7751a990`)
- [x] 빈 검색어 → 안내 메시지 (400, `EMPTY_QUERY`)

응답 시간 (VALIDATION.md M5):

- 같은 검색어로 **10회** 검색 완료
- 응답 시간: `1.457934`, `1.641522`, `1.562737`, `0.999582`, `0.731515`, `0.775582`, `1.275733`, `0.760915`, `0.733723`, `0.991464`
- 최장 약 1.64초, P95 대략 2초 이하

---

## 8. 배포 후 보안 빠른 확인

- [x] 배포 홈 HTML에서 `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `KOREAN_LAW_API_KEY` 문자열이 **보이지 않음**
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 노출되는 것은 정상

---

## 9. M5 완료 선언 조건 (`VALIDATION.md` 요약)

- [x] Vercel Production URL 200
- [x] 환경변수 `.env.example`과 1:1 매칭
- [x] `documents` / `document_embeds` 각 ≥ 500
- [x] 배포 URL manual demo 통과
- [ ] `01_PRD.md` §7.2 acceptance criteria 10개 점검

완료 후 `PRD/PROGRESS.md`에 배포 URL과 검증 날짜를 기록하세요.

---

## 10. 다음에 같이 할 작업

1. 테스트용 feedback 행 정리 여부 결정
2. `01_PRD.md` §7.2 acceptance criteria 10개 최종 점검
3. 다음 마일스톤 범위 결정

질문 예: **「테스트용 feedback 행 정리해줘」**, **「M5 인수조건 최종 점검해줘」**

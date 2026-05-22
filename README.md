# 고충처리 자료 검색 지원 시스템 (acrc-search)

고충 조사관이 흩어진 1차 법령 자료(유권해석·의결례·재결례·판례)를
**한 화면에서 의미 기반(시맨틱) 검색**으로 찾을 수 있게 해주는
정부 업무용 웹 도구입니다. (MVP / 데모 단계)

상세 기획은 [`PRD/`](./PRD) 폴더를 참고하세요.

## 기술 스택

- **Next.js 16 (App Router)** + **TypeScript** + **Tailwind CSS v4**
- **Supabase** (Postgres + pgvector) — DB / 임베딩 저장
- **Gemini** `gemini-embedding-001` — 의미 벡터
- **법제처 Open API** — 자료 수집
- **Vercel** — 배포 (M5 단계)

## 빠르게 돌려보기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 셋업

```bash
cp .env.example .env
```

그리고 `.env` 파일을 열어 6개 변수를 채워주세요.

| 변수 | 어디서 받나 |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Supabase 대시보드 > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 같은 곳 |
| `GEMINI_API_KEY` | Google AI Studio |
| `KOREAN_LAW_API_KEY` | open.law.go.kr |

> `.env` 파일은 `.gitignore` 에 의해 **절대 Git 에 올라가지 않습니다**.
> 키를 코드에 직접 적지 마세요.

### 3. DB 스키마 만들기

Supabase 대시보드에 로그인 → **SQL Editor** → **New query** →
[`supabase/migrations/001_init.sql`](./supabase/migrations/001_init.sql)
의 내용을 통째로 붙여넣고 **Run**.

Table Editor 에서 `documents`, `document_embeds`, `feedback`, `users`
4개 테이블이 보이면 성공입니다.

### 4. 개발 서버 띄우기

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기.

## 자주 쓰는 명령

| 명령 | 용도 |
|---|---|
| `npm run dev` | 로컬 개발 서버 (Hot Reload) |
| `npm run build` | 프로덕션 빌드 (Vercel 배포 전 필수) |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run lint` | ESLint 검사 |

## 디렉토리 구조

```
acrc-search-ray-ho33/
├── app/                          # Next.js App Router (페이지·API 라우트)
├── components/                    # 재사용 UI 컴포넌트 (M3 이후)
├── lib/                          # 비즈니스 로직
│   ├── db.ts                     # Supabase 클라이언트 단일 진입점
│   └── types.ts                  # 공유 타입
├── scripts/                      # 자료 수집·임베딩 스크립트 (M2 이후)
├── supabase/migrations/          # SQL 마이그레이션
├── PRD/                          # 기획·운영 계약 문서들
└── public/                       # 정적 파일
```

상세 구조와 "절대 하지 마" 규칙은 [`PRD/04_PROJECT_SPEC.md`](./PRD/04_PROJECT_SPEC.md) 참고.

## 진행 상황

현재 마일스톤은 [`PRD/PROGRESS.md`](./PRD/PROGRESS.md) 에 항상 최신 상태로 기록됩니다.

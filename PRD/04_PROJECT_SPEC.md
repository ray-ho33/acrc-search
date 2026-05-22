# 프로젝트 스펙 — 고충처리 자료 검색 지원 시스템

> 이 문서는 AI 코딩 어시스턴트와 개발자가 함께 지켜야 할 **행동 규칙**입니다.
> "절대 하지 마" 목록이 핵심입니다.

## 1. 프로젝트 정체성

- **이름**: 고충처리 자료 검색 지원 시스템 (`acrc-search` 가칭)
- **사용자**: 고충 및 집단갈등조정국 조사관 (정부 직원)
- **현재 단계**: MVP / 데모 / PoC
- **호스팅**: Vercel + Supabase (인터넷 환경, 추후 G-Cloud 이전 가능성)
- **언어/런타임**: TypeScript + Node.js 18+ (Next.js 14 App Router)

## 2. 디렉터리 구조 (확정)

```
/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 검색 메인
│   ├── documents/[id]/page.tsx   # 자료 상세
│   ├── api/
│   │   ├── search/route.ts       # 검색 API
│   │   └── feedback/route.ts     # 환류 입력 API
│   └── layout.tsx
├── components/                    # 재사용 UI 컴포넌트
│   ├── SearchBar.tsx
│   ├── ResultCard.tsx
│   ├── FilterPanel.tsx
│   └── ...
├── lib/                          # 비즈니스 로직
│   ├── db.ts                     # Supabase 클라이언트 (전용 진입점)
│   ├── embed.ts                  # Gemini 임베딩 호출
│   ├── search.ts                 # 검색 로직
│   └── types.ts                  # 공유 타입
├── scripts/                      # 자료 수집·임베딩 스크립트
│   ├── lib/
│   │   ├── acr-download.mjs      # (이전 레포에서 이식) 법제처 API 호출
│   │   ├── gemini-embed.mjs      # (이전 레포에서 이식) Gemini 임베딩
│   │   └── load-env.mjs
│   ├── ingest-decisions.mjs      # 의결례 수집 → DB 적재
│   └── build-embeddings.mjs      # 임베딩 일괄 생성 → DB 적재
├── supabase/
│   └── migrations/               # SQL 마이그레이션
│       └── 001_init.sql          # documents/document_embeds/feedback 테이블
├── public/
├── PRD/                          # 본 PRD 문서들
├── .env.example                  # 환경변수 예시 (Git 포함)
├── .env                          # 실제 키 (Git 제외!)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── README.md
```

## 3. 절대 하지 마 (Hard Rules)

### 3.1 보안

- ❌ `.env`, `secrets`, `*.key`, `*.pem` 등을 **Git에 커밋하지 마라**.
- ❌ API 키, Supabase Service Key를 **클라이언트 측 코드(브라우저 번들)에 노출하지 마라**. 서버 사이드 라우트(`app/api/`)에서만 사용.
- ❌ `SUPABASE_SERVICE_KEY`는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 마라.
- ❌ 사용자 입력을 **검증 없이** SQL에 직접 넣지 마라 (Supabase JS SDK 사용 시 자동으로 파라미터화됨, 수동 SQL 작성 시 주의).
- ❌ 정부 자료의 **원문 출처·라이선스 표기를 누락하지 마라**. 카드/상세 화면에 출처·결정일·원문 링크 항상 노출.

### 3.2 코드 구조

- ❌ Supabase 클라이언트를 컴포넌트마다 직접 `createClient()`하지 마라. **반드시 `lib/db.ts`를 통해 접근.**
- ❌ Gemini API를 컴포넌트나 클라이언트에서 직접 호출하지 마라. 서버 라우트만.
- ❌ 새 의존성을 추가하기 전 **가능하면 기존 의존성으로 해결**할 수 있는지 먼저 검토.
- ❌ 코드에 `// 이것은 ~를 합니다` 류의 **명백한 narration 주석 금지**. 주석은 "왜"만.

### 3.3 데이터

- ❌ 자료 본문 전문을 **외부 API로 그대로 보내지 마라**. Phase 1은 임베딩만, Phase 3 AI 요약은 별도 정책 결정 후 진행.
- ❌ 사용자가 입력한 환류 메모(`feedback.note`)를 다른 사용자에게 **MVP 단계에서 노출하지 마라**. Phase 3에서 공개 범위 정책 결정.
- ❌ `documents.full_text`를 검색 API 응답에 통째로 담지 마라. 카드 미리보기는 `summary` 또는 `full_text.slice(0, 300)`.

### 3.4 배포

- ❌ Vercel 환경변수에 키를 넣지 않고 배포하지 마라. 배포 전 `.env.example`과 Vercel 환경변수 목록 1:1 매칭 확인.
- ❌ Supabase Free Tier 한도(데이터 500MB, 월 5GB 전송)를 초과하면서 데이터를 무한 적재하지 마라. 한도 모니터링.

## 4. 꼭 해야 하는 것 (Must-Do)

- ✅ 모든 환경변수는 `.env.example`에 빈 값으로 등록 + README 안내.
- ✅ `pnpm install` 또는 `npm install` 후 `npm run dev`만으로 로컬 실행 가능.
- ✅ 데이터베이스 마이그레이션은 `supabase/migrations/` 안에 SQL로 보관.
- ✅ TypeScript `strict: true`.
- ✅ ESLint + Prettier 기본 설정 (Next.js 기본값).
- ✅ 모든 API 라우트는 에러 시 JSON 형식으로 `{ error: { message, code } }` 반환.
- ✅ 디자인 컨셉: 인디고 톤, 차분한 톤앤매너 (Tailwind `indigo-*` + `slate-*` 위주).
- ✅ 카드/상세 화면에 "출처: 권익위 / 결정일: YYYY-MM-DD / 원문 보기" 라인 필수.

## 5. 코드 스타일

- 파일명: 컴포넌트는 `PascalCase.tsx`, 라이브러리는 `kebab-case.ts`, 스크립트는 `kebab-case.mjs`
- import 순서: 외부 라이브러리 → `@/lib/*` → `@/components/*` → 상대 경로
- 함수: 최대한 짧게. 한 함수 ≤ 50줄.
- 한 파일 ≤ 300줄 (초과 시 분리 검토)
- 컴포넌트: Server Component가 기본, "use client"는 정말 필요할 때만 (입력/상호작용 컴포넌트)

## 6. 검증 명령 (Validation Commands)

| 명령 | 목적 |
|------|------|
| `npm run dev` | 로컬 개발 서버 |
| `npm run build` | 프로덕션 빌드 (Vercel 배포 전 필수) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `node scripts/ingest-decisions.mjs --max-pages 2` | 의결례 수집 (테스트) |
| `node scripts/build-embeddings.mjs --limit 10` | 임베딩 생성 (테스트) |

## 7. 이전 레포 재사용 가이드

이전 레포 `https://github.com/ray-ho33/jeob-su`에서 다음을 **그대로 또는 이식**:

| 이전 레포 파일 | 이번 프로젝트 위치 | 변경 사항 |
|------------|---------------|-----------|
| `scripts/lib/acr-download.mjs` | `scripts/lib/acr-download.mjs` | 결과 저장처를 파일 → Supabase로 변경 |
| `scripts/lib/gemini-embed.mjs` | `scripts/lib/gemini-embed.mjs` | 그대로 |
| `scripts/lib/load-env.mjs` | `scripts/lib/load-env.mjs` | 그대로 |
| `scripts/lib/acr-index-build.mjs` | `scripts/build-embeddings.mjs` | `index.json` → DB INSERT |
| `scripts/lib/acr-semantic-search.mjs` | `lib/search.ts` | 파일 인덱스 → pgvector SQL |

이전 레포의 **MCP stdio 서버 코드는 이식하지 않음**. 이번 프로젝트는 웹앱.

## 8. 의사결정 우선순위

여러 선택지 사이에서 헷갈릴 때 순서:

1. **사용자(조사관)에게 더 좋은 경험인가?**
2. **이전 레포에서 검증된 패턴을 재사용할 수 있는가?**
3. **G-Cloud 이전 시 옮기기 쉬운가?**
4. **무료 티어 안에서 동작하는가?**
5. **초보자가 이해하기 쉬운가?**

## 9. AI 어시스턴트 행동 규칙

- 큰 변경 전에는 계획을 보여주고 합의받는다.
- 한 번에 한 가지 일만 한다. (검색 UI + DB 스키마 + 배포 한꺼번에 X)
- 각 변경 후 어떤 파일을 왜 바꿨는지 한국어로 설명한다.
- 에러 메시지를 그대로 무시하지 않는다. 원인 후보를 제시하고 사용자에게 확인 방법을 알려준다.
- 새로운 외부 의존성을 추가할 때는 사용자에게 묻는다.

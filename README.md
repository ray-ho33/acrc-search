# acrc-search

고충처리 자료를 의미 기반으로 검색할 수 있는 웹 애플리케이션입니다.

국민권익위원회 의결례, 법제처 유권해석 등 행정·법률 검토에 필요한 1차 자료를 수집하고, Gemini 임베딩과 Supabase `pgvector`를 이용해 키워드가 정확히 일치하지 않아도 관련 문서를 찾을 수 있도록 만든 MVP 프로젝트입니다.

## 배포 사이트

- Production: https://acrc-search.vercel.app/

배포 사이트에서는 검색어를 입력해 관련 문서를 조회하고, 결과 카드에서 문서 상세 페이지로 이동할 수 있습니다. 문서가 실제 업무에 도움이 되었는지 피드백도 남길 수 있습니다.

## 주요 기능

- 자연어 기반 고충처리 자료 검색
- 문서 유형·연도 필터링
- 검색 결과 요약, 출처, 기관, 결정일 표시
- 문서 상세 페이지에서 원문 내용 확인
- 검색 결과에 대한 사용자 피드백 저장
- Claude.ai 커스텀 커넥터용 MCP API 제공
- 자료 수집, 임베딩 생성, DB 상태 확인용 스크립트 제공

## 기술 스택

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Supabase Postgres
- Supabase `pgvector`
- Google Gemini `gemini-embedding-001`
- Vercel

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env`에 아래 값을 채웁니다.

| 변수 | 설명 |
| --- | --- |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_KEY` | Supabase `service_role` 키. 서버 스크립트와 API에서 사용 |
| `NEXT_PUBLIC_SUPABASE_URL` | 브라우저에서 접근 가능한 Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase `anon` 키 |
| `GEMINI_API_KEY` | Google AI Studio에서 발급한 Gemini API 키 |
| `KOREAN_LAW_API_KEY` | 법제처 Open API 키 |
| `LAW_OC` | 법제처 Open API 호환용 키 이름이 필요한 경우 사용하는 선택 변수 |

주의: `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `KOREAN_LAW_API_KEY`는 공개 저장소에 올리면 안 됩니다. `.env` 파일은 `.gitignore`에 포함되어 있습니다.

### 3. Supabase 스키마 생성

Supabase 대시보드의 SQL Editor에서 `supabase/migrations` 폴더의 SQL을 순서대로 실행합니다.

```text
001_init.sql
002_grants.sql
003_match_documents.sql
004_fix_acr_public_urls.sql
005_restrict_feedback_writes.sql
006_restrict_anon_reads.sql
```

정상적으로 실행되면 `documents`, `document_embeds`, `feedback`, `users` 테이블과 검색용 RPC가 생성됩니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속합니다.

## 데이터 적재와 임베딩

초기 DB가 비어 있다면 자료 수집과 임베딩 생성을 실행합니다.

```bash
npm run ingest
npm run embed
```

DB 연결과 적재 상태는 아래 명령으로 확인할 수 있습니다.

```bash
npm run check:db
```

대량 적재나 운영 DB 작업 전에는 Supabase 사용량, Gemini API 한도, 공개 API 호출 제한을 먼저 확인하세요.

## 자주 쓰는 명령

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 로컬 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm test` | Vitest 테스트 실행 |
| `npm run ingest` | 원천 자료 수집 |
| `npm run embed` | 문서 임베딩 생성 |
| `npm run check:db` | Supabase 연결과 데이터 상태 확인 |

## 프로젝트 구조

```text
app/                    Next.js 페이지와 API 라우트
components/             검색 UI와 피드백 UI 컴포넌트
lib/                    DB, 검색, 임베딩, 피드백, MCP 로직
scripts/                자료 수집·임베딩·DB 점검 스크립트
supabase/migrations/    Supabase 스키마와 권한 설정 SQL
tests/                  단위 테스트
PRD/                    기획, 데이터 모델, 진행 기록
```

## API 개요

### `POST /api/search`

의미 기반 문서 검색을 수행합니다.

요청 예시:

```json
{
  "q": "층간소음 민원 처리",
  "filters": {
    "type": "의결례",
    "year": 2023
  },
  "limit": 10
}
```

응답은 검색 결과 목록을 `results` 배열로 반환합니다. 빈 검색어는 `EMPTY_QUERY` 오류를 반환합니다.

### `POST /api/feedback`

문서가 도움이 되었는지에 대한 피드백을 저장합니다. 상세한 입력 검증 정책은 `lib/feedback.ts`와 `tests/feedback-validation.test.ts`를 참고하세요.

### `POST /api/mcp`

Claude.ai 커스텀 커넥터에서 사용할 수 있는 MCP(JSON-RPC) 엔드포인트입니다.

운영 URL:

```text
https://acrc-search.vercel.app/api/mcp
```

제공 도구:

| 도구 | 설명 |
| --- | --- |
| `health_check` | Supabase 연결 상태, 문서 수, 임베딩 모델 정보를 확인 |
| `search_similar_decisions` | 민원 문장으로 유사 의결례 검색 |
| `get_decision_detail` | 검색 결과의 `id`로 결정문 상세 내용 조회 |

요청 예시:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_similar_decisions",
    "arguments": {
      "query": "통학로 횡단보도 설치 민원",
      "limit": 3
    }
  }
}
```

현재 운영 배포에서 확인된 상태:

```text
health_check OK
문서 수: 640건
임베딩 모델: gemini-embedding-001
임베딩 차원: 1536
```

## 배포

이 프로젝트는 Vercel 배포를 기준으로 구성되어 있습니다.

1. GitHub 저장소를 Vercel에 Import합니다.
2. Vercel Project Settings에서 `.env.example`에 있는 환경 변수를 등록합니다.
3. Production 배포 후 `/`, `/api/search`, 문서 상세 페이지, `/api/feedback`, `/api/mcp` 동작을 확인합니다.

현재 운영 배포 URL은 https://acrc-search.vercel.app/ 입니다.
Claude.ai 커스텀 커넥터에는 https://acrc-search.vercel.app/api/mcp 를 등록합니다.

## 참고 문서

- 기획과 진행 기록: [`PRD/`](./PRD)
- Supabase 마이그레이션: [`supabase/migrations`](./supabase/migrations)
- 환경 변수 예시: [`.env.example`](./.env.example)

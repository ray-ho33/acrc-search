# M1/M2 복기 학습 노트

> 목적: 나중에 이 프로젝트를 다시 볼 때, M1과 M2에서 무엇을 했고 왜 했는지 빠르게 떠올리기 위한 기록입니다.

## 전체 흐름

이 프로젝트는 고충처리 자료를 검색하기 위한 웹앱입니다.

- M1: 앱과 DB의 기본 뼈대를 만들었습니다.
- M2: 실제 의결례 데이터를 수집하고, 의미 검색을 위한 임베딩을 만들었습니다.
- M3부터: 사용자가 검색어를 입력하면 비슷한 의결례를 찾아 보여주는 화면을 만듭니다.

## M1. 프로젝트 부트스트랩 + DB

### 한 일

1. Next.js 앱을 만들었습니다.
   - `app/` 폴더를 쓰는 App Router 구조입니다.
   - TypeScript, Tailwind CSS, ESLint를 함께 사용합니다.

2. 기본 검증 명령을 정리했습니다.
   - `npm run dev`: 개발 서버 실행
   - `npm run typecheck`: TypeScript 타입 검사
   - `npm run lint`: ESLint 검사
   - `npm run build`: 배포용 빌드

3. Supabase 연결 규칙을 만들었습니다.
   - `lib/db.ts`가 Supabase 클라이언트의 단일 진입점입니다.
   - 서버에서는 `SUPABASE_SERVICE_KEY`를 사용합니다.
   - 브라우저에서는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 사용합니다.

4. 환경변수 예시를 만들었습니다.
   - `.env.example`에는 변수 이름만 둡니다.
   - 실제 키는 `.env`에 넣습니다.
   - `.env`는 `.gitignore`에 포함되어 Git에 올라가지 않습니다.

5. DB 스키마를 만들었습니다.
   - `supabase/migrations/001_init.sql`
   - `documents`: 의결례 같은 원문 자료
   - `document_embeds`: 의미 검색용 숫자 벡터
   - `feedback`: 나중에 조사관 피드백 저장
   - `users`: 이후 사용자 관리용 빈 테이블

### 왜 이렇게 했나

Supabase 키는 비밀 키와 공개 키가 다릅니다. 특히 `SUPABASE_SERVICE_KEY`는 서버 전용이라 브라우저에 노출되면 안 됩니다. 그래서 DB 연결을 `lib/db.ts`에 모아두고, 아무 컴포넌트에서나 직접 `createClient()`를 부르지 않도록 했습니다.

### 배운 개념

- **Next.js App Router**: `app/page.tsx`가 `/` 화면이 됩니다.
- **환경변수**: API 키처럼 비밀인 값은 코드가 아니라 `.env`에 둡니다.
- **마이그레이션**: DB 구조를 SQL 파일로 기록해두는 방식입니다.
- **타입 검사**: TypeScript가 “이 값이 예상한 모양인가?”를 확인합니다.

### M1에서 확인한 것

- `npm run typecheck` 성공
- `npm run lint` 성공
- `npm run build` 성공
- `npm run dev`에서 `http://localhost:3000` 200 응답
- Supabase SQL Editor에서 `001_init.sql` 실행
- Table Editor에서 테이블 4개 확인

## M2. 자료 수집 + 임베딩 파이프라인

### 한 일

1. 이전 레포 `jeob-su`에서 검증된 스크립트 구조를 가져왔습니다.
   - `scripts/lib/load-env.mjs`: Node 스크립트에서 `.env` 읽기
   - `scripts/lib/acr-download.mjs`: 법제처 Open API에서 권익위 의결례 다운로드
   - `scripts/lib/gemini-embed.mjs`: Gemini 임베딩 API 호출

2. 이 프로젝트용 변환 코드를 추가했습니다.
   - `scripts/lib/acr-text.mjs`: 의결례 JSON에서 검색용 텍스트 만들기
   - `scripts/lib/acr-map.mjs`: 의결례 JSON을 `documents` 테이블 행으로 변환
   - `scripts/lib/supabase-server.mjs`: 스크립트에서 Supabase service key로 접속
   - `scripts/lib/jwt-role.mjs`: Supabase JWT 키가 `anon`인지 `service_role`인지 확인

3. 실행 스크립트를 만들었습니다.
   - `scripts/ingest-decisions.mjs`
     - 법제처 API 또는 `.data/acr-ingest` 캐시에서 의결례를 읽습니다.
     - `documents` 테이블에 UPSERT합니다.
   - `scripts/build-embeddings.mjs`
     - 아직 임베딩이 없는 문서를 찾습니다.
     - Gemini `RETRIEVAL_DOCUMENT` 임베딩을 호출합니다.
     - L2 정규화 후 `document_embeds` 테이블에 UPSERT합니다.
   - `scripts/check-supabase.mjs`
     - Supabase 키 종류와 DB 쓰기 권한을 진단합니다.

4. `package.json`에 명령을 추가했습니다.
   - `npm run ingest`
   - `npm run embed`
   - `npm run check:db`

5. Supabase 권한 SQL을 추가했습니다.
   - `supabase/migrations/002_grants.sql`
   - SQL로 직접 만든 테이블에 `service_role`이 접근할 수 있게 권한을 줍니다.

### 실행 흐름

```bash
npm run ingest -- --max-pages 2
npm run embed -- --limit 50
```

흐름은 아래와 같습니다.

```text
법제처 Open API
→ 의결례 JSON 다운로드
→ documents 테이블 저장
→ Gemini 임베딩 생성
→ L2 정규화
→ document_embeds 테이블 저장
```

### 만난 문제와 해결

#### 1. `permission denied for table documents`

원인:

- `SUPABASE_SERVICE_KEY` 자리에 `anon` 키가 들어가 있었습니다.
- `anon` 키는 공개용이라 쓰기 권한이 제한됩니다.

해결:

- Supabase 대시보드에서 `service_role` 키를 다시 복사해 `.env`의 `SUPABASE_SERVICE_KEY`에 넣었습니다.
- `npm run check:db`로 키의 role을 확인할 수 있게 했습니다.

#### 2. `date/time field value out of range: "2023-06-00"`

원인:

- 외부 API에서 날짜의 일이 `00`인 잘못된 값이 왔습니다.
- Postgres의 `date` 타입은 `2023-06-00`을 받을 수 없습니다.

해결:

- `scripts/lib/acr-map.mjs`의 `parseDecidedAt()`에서 실제 날짜인지 검사하게 했습니다.
- 잘못된 날짜는 `null`로 저장합니다.

#### 3. 이미 받은 API 결과를 다시 받고 싶지 않음

해결:

```bash
npm run ingest -- --max-pages 2 --skip-download
```

`--skip-download`는 `.data/acr-ingest`에 이미 저장된 JSON만 DB에 다시 반영합니다.

### 배운 개념

- **UPSERT**: 같은 `external_id`가 있으면 업데이트하고, 없으면 새로 넣는 저장 방식입니다.
- **임베딩**: 문서를 숫자 배열로 바꾸어 의미가 비슷한 문서를 찾을 수 있게 하는 기술입니다.
- **L2 정규화**: 벡터의 길이를 1에 가깝게 맞추어 비교를 안정적으로 만드는 과정입니다.
- **service_role 키**: 서버나 스크립트에서만 쓰는 강한 권한의 비밀 키입니다.
- **캐시**: 외부 API에서 받은 결과를 `.data/`에 저장해 재사용하는 방식입니다.

### M2에서 확인한 것

- `documents` 테이블에 의결례 데이터 적재 확인
- `document_embeds` 테이블에 임베딩 데이터 적재 확인
- `npm run check:db`로 Supabase 쓰기 권한 확인
- `npm run typecheck`, `npm run lint`, `npm run build` 통과

## 지금 상태

M2까지 끝났기 때문에 DB에는 검색 대상 데이터와 임베딩이 있습니다. 아직 사용자가 검색할 화면은 없고, `app/page.tsx`는 기본 Next.js placeholder 상태입니다.

다음 단계인 M3에서는 아래를 만듭니다.

- 검색어를 `RETRIEVAL_QUERY` 임베딩으로 바꾸는 코드
- pgvector로 비슷한 문서를 찾는 검색 함수
- `POST /api/search` API
- 검색창, 필터, 결과 카드 UI


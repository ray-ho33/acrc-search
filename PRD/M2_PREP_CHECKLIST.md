# M2 시작 전 준비 체크리스트

> 목적: M2(자료 수집 + 임베딩 파이프라인)를 시작하기 전에, 사용자가 직접 해야 하는 준비를 빠짐없이 끝내기 위한 문서입니다.
> M2는 외부 API와 Supabase DB에 실제로 연결하므로, `.env`와 DB 테이블이 준비되어 있어야 합니다.

## 0. 현재 상태 요약

- M1 코드 작업은 완료되었습니다.
- Next.js 앱은 `npm run dev`에서 HTTP 200으로 뜹니다.
- `.env.example`은 만들어져 있습니다.
- `supabase/migrations/001_init.sql`도 만들어져 있습니다.
- M2 시작 전에는 아래 3가지를 사용자가 직접 확인해야 합니다.

## 1. `.env` 파일 만들기

터미널에서 아래 명령을 실행하세요.

```bash
cp .env.example .env
```

주의:

- `env.example`이 아니라 `**.env.example**` 입니다. 앞에 점(`.`)이 있습니다.
- `.env`는 실제 키를 넣는 파일입니다.
- `.env`는 Git에 올리면 안 됩니다. 현재 `.gitignore`에 포함되어 있습니다.

## 2. `.env`에 실제 값 채우기

`.env` 파일을 열고 아래 항목을 채우세요.

```bash
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
KOREAN_LAW_API_KEY=
LAW_OC=
```

입력 기준:


| 변수                              | 어디서 가져오나요?                             | 설명                                              |
| ------------------------------- | -------------------------------------- | ----------------------------------------------- |
| `SUPABASE_URL`                  | Supabase 대시보드 > Project Settings > API | 서버에서 Supabase에 연결할 주소                           |
| `SUPABASE_SERVICE_KEY`          | Supabase 대시보드 > Project Settings > API | 서버 전용 관리자 키. 절대 브라우저에 노출하면 안 됨                  |
| `NEXT_PUBLIC_SUPABASE_URL`      | `SUPABASE_URL`과 같은 값                   | 브라우저에서 써도 되는 공개 URL                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 대시보드 > Project Settings > API | 브라우저에서 써도 되는 익명 키                               |
| `GEMINI_API_KEY`                | Google AI Studio                       | 문서를 숫자 벡터로 바꾸는 임베딩 API 키                        |
| `KOREAN_LAW_API_KEY`            | open.law.go.kr                         | 법제처 Open API 키                                  |
| `LAW_OC`                        | open.law.go.kr                         | 이전 레포/도구 호환용. `KOREAN_LAW_API_KEY`와 같은 값을 넣어도 됨 |


초보자용 설명:

- `NEXT_PUBLIC_`이 붙은 값은 브라우저에 공개될 수 있습니다.
- `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `KOREAN_LAW_API_KEY`, `LAW_OC`는 비밀 키입니다.
- 비밀 키는 코드에 직접 쓰지 말고 `.env`에만 넣습니다.

## 3. Supabase SQL 실행하기

Supabase 대시보드에서 다음 순서로 진행하세요.

1. Supabase 프로젝트 열기
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. **New query** 클릭
4. 이 프로젝트의 `supabase/migrations/001_init.sql` 파일 내용을 통째로 복사
5. SQL Editor에 붙여넣기
6. **Run** 클릭

성공하면 Table Editor에서 아래 4개 테이블이 보여야 합니다.

`npm run ingest` 실행 시 `permission denied for table documents` 가 나오면, 이어서 `supabase/migrations/002_grants.sql` 도 SQL Editor에서 실행하세요. (`service_role` 키를 `SUPABASE_SERVICE_KEY`에 넣었는지도 확인)


- `documents`
- `document_embeds`
- `feedback`
- `users`

## 4. 실행 확인

터미널에서 아래 명령을 실행해 현재 앱이 여전히 정상인지 확인하세요.

```bash
npm run typecheck
npm run lint
npm run build
```

모두 에러 없이 끝나면 좋습니다.

개발 서버 확인은 아래처럼 합니다.

```bash
npm run dev
```

브라우저에서 열기:

```text
http://localhost:3000
```

## 5. M2에서 제가 이어서 할 일

위 준비가 끝나면 M2에서 아래 작업을 진행합니다.

1. 이전 레포 `https://github.com/ray-ho33/jeob-su`에서 재사용 스크립트 가져오기
  - `scripts/lib/acr-download.mjs`
  - `scripts/lib/gemini-embed.mjs`
  - `scripts/lib/load-env.mjs`
2. `scripts/ingest-decisions.mjs` 작성
  - 법제처/권익위 자료 수집
  - Supabase `documents` 테이블에 UPSERT
3. `scripts/build-embeddings.mjs` 작성
  - `documents`에서 임베딩 없는 문서 찾기
  - Gemini `RETRIEVAL_DOCUMENT` 임베딩 호출
  - L2 정규화 후 `document_embeds`에 UPSERT
4. 검증
  - `documents` 행 10건 이상
  - `document_embeds` 행 50건 이상

## 6. 완료 체크박스

- `cp .env.example .env` 실행 완료
- `.env`에 Supabase 값 4개 입력 완료
- `.env`에 `GEMINI_API_KEY` 입력 완료
- `.env`에 `KOREAN_LAW_API_KEY` 입력 완료
- `.env`에 `LAW_OC` 입력 완료 (`KOREAN_LAW_API_KEY`와 같은 값 가능)
- Supabase SQL Editor에서 `001_init.sql` 실행 완료
- Table Editor에서 `documents`, `document_embeds`, `feedback`, `users` 확인 완료
- `npm run typecheck` 통과
- `npm run lint` 통과
- `npm run build` 통과

## 7. 다음 요청 문장

위 체크박스를 끝내면 이렇게 말씀해주세요.

```text
M2 시작해줘. .env 작성했고, Supabase SQL 실행해서 테이블 4개 확인했어.
```


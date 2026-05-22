# 데이터 모델 — 고충처리 자료 검색 지원 시스템

> 개념적 ERD 및 Supabase Postgres 스키마 초안
> 버전: v0.1 (Phase 1 MVP 기준 / Phase 2~3 확장 필드 표시)

## 1. 개념 다이어그램

```
┌────────────────────┐         ┌────────────────────┐
│     documents      │ 1     1 │  document_embeds   │
│  (자료 한 건)        │─────────│   (의미 벡터)        │
└────────────────────┘         └────────────────────┘
        │
        │ 1
        │
        │ N
┌────────────────────┐         ┌────────────────────┐
│     feedback       │ N     1 │       users        │
│  (조사관 환류 메모)    │─────────│   (사용자 정보)        │
└────────────────────┘         └────────────────────┘
        │ N
        │
        │ 1
┌────────────────────┐
│    bookmarks       │   (Phase 2)
│   (즐겨찾기)         │
└────────────────────┘

┌────────────────────┐
│   search_logs      │   (Phase 2)
│  (검색 로그)         │
└────────────────────┘
```

## 2. 핵심 엔티티 설명

| 엔티티 | 일상 용어로 | MVP 포함 |
|--------|------------|---------|
| `documents` | 검색 대상이 되는 자료 한 건. 의결례 한 건, 유권해석 한 건. | ✅ |
| `document_embeds` | 자료를 숫자 벡터로 바꿔놓은 것. 의미 비교에 씀. | ✅ |
| `users` | 시스템을 쓰는 사람 (조사관/curator/관리자). | ⚠️ MVP는 익명, Phase 3에 활성화 |
| `feedback` | 사건 종결 후 조사관이 자료에 남기는 메모/평가. | ⚠️ MVP는 본인 메모만 |
| `bookmarks` | 조사관 개인 즐겨찾기 | ❌ Phase 2 |
| `search_logs` | 어떤 검색어로 어떤 결과를 봤는지 기록 | ❌ Phase 2 |

## 3. Supabase Postgres 스키마 (Phase 1)

### 3.1 `documents`

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `source` | `text` | "권익위" / "법제처" / "행심위" / "대법원" |
| `type` | `text` | "의결례" / "유권해석" / "재결례" / "판례" |
| `external_id` | `text` UNIQUE | 출처 사이트의 결정번호/사건번호 |
| `title` | `text` | 결정 제목 |
| `agency` | `text` | 처분 기관 |
| `decided_at` | `date` | 결정일 |
| `case_no` | `text` | 사건번호 (있을 시) |
| `summary` | `text` | 결정요지 (있을 시) |
| `full_text` | `text` | 본문 전문 |
| `url` | `text` | 원문 URL |
| `tags` | `text[]` | 자동·수동 태그 (Phase 2부터 활용) |
| `created_at` | `timestamptz` | `now()` |
| `updated_at` | `timestamptz` | `now()` |

**인덱스**:
- `(source, type)` — 필터링용
- `decided_at DESC` — 정렬용
- 풀텍스트: `to_tsvector('simple', title || ' ' || summary)` (Phase 2 BM25 도입 시)

### 3.2 `document_embeds`

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `document_id` | `uuid` PK, FK → documents | 1:1 |
| `model` | `text` | "gemini-embedding-001" |
| `dimensions` | `int` | 1536 (또는 모델 기본) |
| `embedding` | `vector(1536)` | pgvector 컬럼 |
| `embedded_at` | `timestamptz` | 임베딩 생성 시각 |

**인덱스**:
- `ivfflat (embedding vector_cosine_ops)` 또는 `hnsw` (데이터 ≥ 1만 건일 때)

### 3.3 `feedback` (MVP는 본인 메모만)

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `id` | `uuid` PK | |
| `document_id` | `uuid` FK | |
| `user_id` | `uuid` FK (nullable) | MVP는 NULL 허용 (익명) |
| `case_no` | `text` | 어떤 사건에서 활용했나 (선택) |
| `helpful` | `boolean` | 👍/👎 (선택) |
| `note` | `text` | 자유 메모 |
| `created_at` | `timestamptz` | |

### 3.4 `users` (Phase 3 활성화, MVP에서는 빈 테이블만 생성)

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `id` | `uuid` PK | `auth.users` 연결 |
| `email` | `text` UNIQUE | |
| `name` | `text` | |
| `role` | `text` | "investigator" / "curator" / "admin" |
| `department` | `text` | 부서명 |
| `created_at` | `timestamptz` | |

## 4. Phase 2~3 추가 테이블 (참고용)

### 4.1 `bookmarks` (Phase 2)
- `user_id`, `document_id`, `created_at`

### 4.2 `search_logs` (Phase 2)
- `id`, `user_id`, `query`, `result_count`, `clicked_ids`, `created_at`

### 4.3 `audit_logs` (Phase 3)
- `id`, `user_id`, `action`, `target_type`, `target_id`, `meta`, `created_at`

## 5. RLS (행 수준 보안) 정책

| 단계 | 정책 |
|------|------|
| MVP (Phase 1) | RLS 미적용. 모두가 모든 자료를 읽을 수 있음. 데모 단계 한정. |
| Phase 3 | `documents` 읽기는 인증된 사용자만. `feedback`은 본인 것만 수정/삭제. `audit_logs`는 admin만 읽기. |

## 6. 환경변수 (전체)

| 변수명 | 용도 | 어디서? |
|--------|------|---------|
| `SUPABASE_URL` | DB 연결 URL | Supabase 대시보드 |
| `SUPABASE_SERVICE_KEY` | 서버 사이드 키 (RLS 우회용) | Supabase 대시보드 |
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 DB URL (공개해도 됨) | 위와 동일 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 익명 키 (공개해도 됨) | 위와 동일 |
| `GEMINI_API_KEY` | 임베딩 호출 | Google AI Studio |
| `KOREAN_LAW_API_KEY` 또는 `LAW_OC` | 법제처 Open API | open.law.go.kr |

**원칙**: 모든 키는 `.env`에서 읽어 사용하며, **Git에 절대 커밋하지 않음**. `.env.example`에 변수명만 기록.

## 7. 마이그레이션 전략 (G-Cloud 이전 대비)

- Supabase 의존을 `lib/db.ts` 한 파일로 격리. 다른 코드는 이 파일만 통해 DB에 접근.
- Postgres는 G-Cloud에서도 동일하게 동작. 이전 시 Supabase JS SDK → `pg`/`postgres.js`로 갈아끼우면 됨.
- pgvector도 표준 Postgres 확장이라 G-Cloud Postgres에서 그대로 활용 가능.

## 8. NEEDS CLARIFICATION

- [NEEDS CLARIFICATION] **임베딩 차원**: Gemini는 768/1536/3072 중 선택 가능. 1536으로 시작하지만 성능/비용 검증 후 조정.
- [NEEDS CLARIFICATION] **`source` enum vs free text**: 자료 출처가 4개로 고정이면 enum 타입이 낫지만, Phase 4에서 출처를 더 추가할 가능성을 고려해 일단 `text`로 둠.

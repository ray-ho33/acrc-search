# acrc-search 확장 계획서 — ACRC Decisions 멀티에이전트 의결서 작성 웹도구

> 목적: 기존 `https://github.com/ray-ho33/acrc-search`의 Next.js/Supabase/MCP 구조를 유지하면서, 현재 저장소의 `acrc-decision-drafter` 스킬 기능을 웹도구로 확장한다.
> 기준일: 2026-06-10
> 전제: `acrc-search`는 이미 검색·상세·피드백·MCP API가 동작하는 MVP이며, 새 기능은 기존 검색 앱을 대체하지 않고 덧붙인다.

## 1. 한 줄 요약

`acrc-search`의 의결례 시맨틱 검색 구조를 그대로 유지하고, 검색된 유사 의결례와 검증된 법령을 바탕으로 여러 역할의 에이전트가 권익위식 `의결서 초안`을 작성·검토하는 내부 조사관용 웹 워크벤치를 추가한다.

## 2. 핵심 방향

1. 기존 검색 앱은 유지한다.
   - `/` 검색 화면, `/documents/[id]` 상세 화면, `/api/search`, `/api/feedback`, `/api/mcp`는 깨지지 않아야 한다.
   - 기존 `documents`, `document_embeds`, `feedback`, `users` 테이블은 재사용한다.

2. 의결서 작성 기능은 별도 워크벤치로 추가한다.
   - 새 화면은 `/drafts` 또는 `/drafts/new` 아래에 둔다.
   - 문서 상세 화면에는 "이 의결례를 참고해 초안 작성" 진입 버튼만 추가한다.

3. 단일 AI 생성이 아니라 멀티에이전트 파이프라인으로 구현한다.
   - 사실정리, 유사 의결례 분석, 법령검증, 관할검토, 주문검토, 개인정보검토, 문체정리를 분리한다.
   - 각 에이전트 산출물은 최종 초안과 분리 저장한다.
   - 충돌·불확실성은 자동으로 덮지 않고 `검토 쟁점` 또는 `확인 필요`로 남긴다.

4. 법령과 사실은 보수적으로 다룬다.
   - 법령명·조문·권한·기한·구제수단은 공식 출처 또는 `korean-law-mcp` 연계로 확인한 것만 확정 문안에 사용한다.
   - 제출 자료만으로 부족한 사실은 `현재 제출된 자료만으로는 확인하기 어렵다`처럼 불확실성을 표시한다.

## 3. acrc-search 현재 구조 보존 원칙

확인한 `acrc-search` 실제 구조:

```text
app/
  page.tsx
  documents/[id]/page.tsx
  api/search/route.ts
  api/feedback/route.ts
  api/mcp/route.ts
components/
  SearchExperience.tsx
  SearchBar.tsx
  FilterPanel.tsx
  ResultCard.tsx
  FeedbackForm.tsx
lib/
  db.ts
  embed.ts
  search.ts
  mcp.ts
  feedback.ts
  types.ts
scripts/
  ingest-decisions.mjs
  build-embeddings.mjs
  check-supabase.mjs
supabase/migrations/
tests/
PRD/
```

추가 기능은 이 구조를 확장한다.

```text
app/
  drafts/
    page.tsx
    new/page.tsx
    [id]/page.tsx
  api/
    drafts/route.ts
    drafts/[id]/route.ts
    drafts/[id]/run/route.ts
    drafts/[id]/agent-runs/route.ts
components/
  DraftCaseForm.tsx
  DraftWorkbench.tsx
  AgentRunPanel.tsx
  DraftPreview.tsx
  SourceLogPanel.tsx
lib/
  drafts.ts
  draft-agents.ts
  draft-render.ts
  law.ts
  acrc-corpus.ts
supabase/migrations/
  006_draft_workbench.sql
tests/
  draft-agents.test.ts
  draft-render.test.ts
  draft-validation.test.ts
```

## 4. 사용자 흐름

### 4.1 검색에서 초안 작성으로

1. 조사관이 `/`에서 민원 쟁점으로 의결례를 검색한다.
2. 조사관이 `/documents/[id]`에서 유사 의결례 전문과 메타데이터를 확인한다.
3. 상세 화면의 "초안 작성에 참고" 버튼을 누른다.
4. `/drafts/new?sourceDocumentId=...`로 이동한다.
5. 조사관이 신청취지, 신청인, 피신청인, 사실관계, 보유 증거, 원하는 구제수단을 입력한다.
6. 시스템이 초안 작업 건을 생성하고 멀티에이전트 검토를 실행한다.
7. 조사관은 각 에이전트 결과와 최종 의결서 초안을 같은 화면에서 확인한다.

### 4.2 민원 원문에서 바로 시작

1. 조사관이 `/drafts/new`에서 민원 원문을 붙여넣는다.
2. `fact_mapper`가 사건 프레임과 누락 정보를 추출한다.
3. `corpus_analyst`가 `documents`/`document_embeds`에서 유사 의결례 2~5건을 찾는다.
4. 나머지 검토 에이전트가 순차 또는 병렬로 검토한다.
5. 조정 단계에서 권익위식 `의결서 초안`을 생성한다.

## 5. 멀티에이전트 파이프라인

| 순서 | 역할 | 입력 | 산출물 | 실패 시 처리 |
|------|------|------|--------|--------------|
| 1 | `fact_mapper` | 사용자 민원 원문, 입력 폼, 참고 문서 | 사건 프레임, 사실관계 타임라인, 다툼 있는 사실, 누락 사실 | 필수 당사자·피신청인·신청취지가 없으면 초안 생성 보류 |
| 2 | `corpus_analyst` | 사건 프레임, 검색 쿼리 | 유사 의결례 2~5건, 주문·판단 구조, 구제수단 패턴 | 유사 사례가 없으면 "유사 의결례 없음"으로 기록하고 계속 |
| 3 | `law_verifier` | 사건 쟁점, 법령 후보 | 검증된 법령·조문, 확인 불가 조문, 별지 후보 | 확인 안 된 조문은 최종 판단의 확정 근거로 사용 금지 |
| 4 | `jurisdiction_reviewer` | 사건 프레임, 법령 검토 | 권익위 관할, 각하·이송·대체절차 리스크 | 각하 가능성 있으면 주문 후보를 보류 또는 분기 |
| 5 | `decision_drafter` | 위 산출물 전체 | 권익위식 의결서 초안 v1 | 누락 사실은 문안 안에 `[확인 필요]`로 표시 |
| 6 | `disposition_reviewer` | 초안 v1 | 주문·판단·결론 일치성 검토 | 불일치 시 조정 단계에서 재작성 |
| 7 | `privacy_safety_reviewer` | 초안 v1, 사용자 원문 | 개인정보·민감정보·프롬프트 인젝션 점검 | 실패 시 사용자에게 초안 공개 금지 |
| 8 | `style_editor` | 검토 완료 초안 | 권익위 문체·형식 정리본 | 의미 변경은 금지하고 표현만 다듬음 |
| 9 | `reconciler` | 모든 에이전트 산출물 | 최종 초안, 검토 쟁점, source log | 해결 안 된 충돌은 `확인 필요`로 남김 |

권장 실행 방식:

- Phase 2: `fact_mapper` → `corpus_analyst` → `law_verifier`까지만 구현한다.
- Phase 3: 전체 파이프라인을 구현한다.
- 초반에는 백그라운드 큐 없이 API 요청 내 순차 실행으로 시작하고, 응답 시간이 길어지면 작업 큐로 분리한다.

## 6. 의결서 초안 산출 형식

기본 산출물은 제출용 진정서가 아니라 국민권익위원회식 `의결서 초안`이다.

```text
국 민 권 익 위 원 회
[제 N 소 위 원 회]

의안번호 : [의안번호 기재]
민원표시 : [사건명]
신 청 인 : [A]
피신청인 : [기관명]
관계기관 : [기관명, 해당 시]
의 결 일 : [의결일 기재]

주 문
[시정권고/의견표명/제도개선 의견표명/기각/각하/이송·안내 문안]

이 유
1. 신청취지
2. 피신청인 등의 주장
3. 사실관계
4. 판단
5. 결론

<별지> 관계법령 등
```

문안 원칙:

- 유사 의결례의 사실관계를 현재 사건 사실로 가져오지 않는다.
- 법령 확인이 안 된 경우 `[조문 확인 필요]` 또는 `추가 확인이 필요하다`로 표시한다.
- `주문`, `판단`, `결론`의 처분 방향이 일치해야 한다.
- 개인정보는 `A`, `B`, `○○`, `(주소 생략)` 등으로 비식별화한다.
- 최종 출력에는 "공식 의결이 아닌 내부 검토용 초안"임을 표시한다.

## 7. 데이터 모델 확장

기존 테이블은 유지하고, 작성 워크벤치 전용 테이블을 추가한다.

### 7.1 `draft_cases`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | `uuid` PK | 초안 작업 ID |
| `created_by` | `uuid nullable` | Phase 3 인증 후 사용자 연결 |
| `title` | `text` | 민원 제목 또는 자동 생성 제목 |
| `applicant_label` | `text` | `A` 등 비식별 신청인 표기 |
| `respondent` | `text` | 피신청인 |
| `related_agencies` | `text[]` | 관계기관 |
| `complaint_text` | `text` | 사용자 입력 원문 |
| `requested_remedy` | `text` | 신청취지·요구사항 |
| `status` | `text` | `draft`, `running`, `needs_review`, `completed`, `failed` |
| `source_document_ids` | `uuid[]` | 사용자가 지정한 참고 의결례 |
| `created_at` | `timestamptz` | 생성일 |
| `updated_at` | `timestamptz` | 수정일 |

### 7.2 `draft_agent_runs`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | `uuid` PK | 에이전트 실행 ID |
| `draft_case_id` | `uuid FK` | 초안 작업 |
| `agent_name` | `text` | 역할명 |
| `status` | `text` | `pending`, `running`, `completed`, `failed`, `blocked` |
| `input_snapshot` | `jsonb` | 실행 당시 입력 |
| `output` | `jsonb` | 구조화 산출물 |
| `error_message` | `text` | 실패 사유 |
| `started_at` | `timestamptz` | 시작 시각 |
| `completed_at` | `timestamptz` | 종료 시각 |

### 7.3 `draft_versions`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | `uuid` PK | 초안 버전 ID |
| `draft_case_id` | `uuid FK` | 초안 작업 |
| `version` | `integer` | v1, v2 |
| `content` | `text` | 의결서 초안 전문 |
| `structured` | `jsonb` | 주문·이유·사실관계·판단 등 구조화본 |
| `source_log` | `jsonb` | 사용한 의결례, 법령, 에이전트 결과 |
| `open_issues` | `jsonb` | 확인 필요·충돌 사항 |
| `created_at` | `timestamptz` | 생성일 |

### 7.4 `draft_sources`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `draft_case_id` | `uuid FK` | 초안 작업 |
| `document_id` | `uuid FK` | 참고 의결례 |
| `source_type` | `text` | `user_selected`, `semantic_search`, `agent_selected` |
| `note` | `text` | 참고 사유 |

## 8. API 계획

| 엔드포인트 | 메서드 | 목적 |
|------------|--------|------|
| `/api/drafts` | `POST` | 초안 작업 생성 |
| `/api/drafts` | `GET` | 초안 작업 목록 |
| `/api/drafts/[id]` | `GET` | 초안 작업, 에이전트 결과, 최신 초안 조회 |
| `/api/drafts/[id]` | `PATCH` | 제목, 신청취지, 입력 원문 수정 |
| `/api/drafts/[id]/run` | `POST` | 멀티에이전트 파이프라인 실행 |
| `/api/drafts/[id]/agent-runs` | `GET` | 에이전트별 상태와 산출물 조회 |

MCP 확장 후보:

| 도구 | 설명 |
|------|------|
| `create_draft_case` | 민원 원문으로 초안 작업 생성 |
| `run_draft_agents` | 특정 초안 작업의 에이전트 파이프라인 실행 |
| `get_draft_case` | 초안과 검토 쟁점 조회 |

주의: MCP에서 바로 최종 의결서만 반환하지 말고, source log와 확인 필요 사항을 함께 반환해야 한다.

## 9. UI 계획

### 9.1 `/drafts`

- 최근 초안 작업 목록
- 상태 필터: 작성중, 검토중, 완료, 실패
- 새 초안 작성 버튼

### 9.2 `/drafts/new`

- 민원 원문 입력
- 신청인 비식별 표기
- 피신청인/관계기관
- 신청취지
- 보유 증거·날짜·절차 이력 입력
- 참고 의결례 선택 영역
- "사건 프레임 추출"과 "전체 초안 작성" 버튼 분리

### 9.3 `/drafts/[id]`

화면은 3열 구조가 적합하다.

- 왼쪽: 사건 입력 정보와 참고 의결례
- 가운데: 에이전트 실행 상태와 검토 결과
- 오른쪽: 의결서 초안 미리보기

필수 상태:

- 에이전트 실행 전
- 실행 중
- 일부 실패
- 확인 필요
- 개인정보 점검 실패
- 최종 초안 생성 완료

## 10. 구현 Phase

### Phase A — 구조 보존형 기반 작업

- [ ] `acrc-search` 레포를 기준으로 브랜치 생성
- [ ] 현재 검색·상세·MCP·피드백 테스트 통과 확인
- [ ] `006_draft_workbench.sql` 추가
- [ ] `lib/drafts.ts`, `lib/draft-render.ts` 추가
- [ ] `/drafts`, `/drafts/new`, `/drafts/[id]` 라우트 껍데기 추가

완료 기준:

- 기존 `/`, `/documents/[id]`, `/api/search`, `/api/mcp`가 그대로 동작한다.
- 새 라우트가 기존 검색 UX를 방해하지 않는다.

### Phase B — 사건 프레임 + 유사 의결례 분석

- [ ] `fact_mapper` 구현
- [ ] `corpus_analyst` 구현
- [ ] 기존 `searchDocuments()`를 재사용해 유사 의결례 2~5건 조회
- [ ] 에이전트 산출물을 `draft_agent_runs.output`에 저장

완료 기준:

- 민원 원문을 넣으면 사건 프레임과 유사 의결례 후보가 분리 표시된다.
- 유사 의결례의 사실관계가 사용자 사건 사실로 자동 편입되지 않는다.

### Phase C — 법령 검증 + 의결서 초안 v1

- [ ] `law_verifier` 구현
- [ ] 법령 확인 불가 항목을 `open_issues`에 저장
- [ ] `decision_drafter`가 권익위식 구조로 초안 v1 생성
- [ ] `<별지> 관계법령 등` 후보 생성

완료 기준:

- 확인 안 된 조문은 확정 근거로 출력되지 않는다.
- 초안은 항상 `주문`, `이유`, `신청취지`, `피신청인 등의 주장`, `사실관계`, `판단`, `결론`을 포함한다.

### Phase D — 검토 에이전트와 조정 단계

- [ ] `jurisdiction_reviewer`
- [ ] `disposition_reviewer`
- [ ] `privacy_safety_reviewer`
- [ ] `style_editor`
- [ ] `reconciler`

완료 기준:

- 개인정보 점검 실패 시 최종 초안 공개가 차단된다.
- `주문`, `판단`, `결론` 불일치가 있으면 `검토 쟁점`으로 표시된다.
- 최종 초안에 source log가 남는다.

### Phase E — MCP 확장과 운영 검증

- [ ] `/api/mcp`에 draft 도구 추가
- [ ] MCP 테스트 추가
- [ ] 실패·재시도·부분 성공 상태 테스트
- [ ] 배포 체크리스트 업데이트

완료 기준:

- 기존 MCP 도구 3개가 회귀 없이 동작한다.
- 새 draft MCP 도구가 source log와 open issues를 함께 반환한다.

## 11. 테스트 계획

| 테스트 | 목적 |
|--------|------|
| `draft-validation.test.ts` | 빈 신청취지, 빈 피신청인, 과도한 원문 길이 등 입력 검증 |
| `draft-agents.test.ts` | 에이전트 출력 스키마와 실패 상태 검증 |
| `draft-render.test.ts` | 의결서 초안 필수 섹션 포함 여부 검증 |
| `mcp-handler.test.ts` 확장 | 기존 MCP 도구 회귀 및 draft 도구 응답 검증 |
| 수동 E2E | 검색 → 상세 → 초안 작성 → 에이전트 실행 → 최종 초안 확인 |

검증 명령:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 12. 보안·품질 규칙

- `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `KOREAN_LAW_API_KEY`는 서버에서만 사용한다.
- 민원 원문과 초안은 개인정보 가능성이 높으므로 Phase 3 전에는 공개 공유 기능을 만들지 않는다.
- `draft_cases.complaint_text`를 외부 모델로 보낼 경우 정책 결정이 필요하다.
- 운영 환경에서는 사용자 인증 전까지 `/drafts`를 숨기거나 관리자용 기능으로 제한한다.
- 에이전트 결과가 사용자 입력 지시문에 의해 시스템 규칙을 우회하지 않도록, 사용자 원문은 데이터로만 다룬다.

## 13. 주요 결정 질문과 추천 답

1. 새 기능을 기존 `acrc-search` 안에 넣을 것인가, 별도 앱으로 만들 것인가?
   - 추천: 기존 `acrc-search` 안에 넣는다. 이미 검색·DB·임베딩·MCP 구조가 있고, 새 기능은 검색 결과를 직접 재사용한다.

2. 원본 `acrc-decisions/*.json` 파일을 그대로 웹앱에 포함할 것인가?
   - 추천: 운영 앱은 Supabase `documents`를 기준으로 하고, 로컬 JSON은 수집·검증·개발용 seed로만 사용한다.

3. 멀티에이전트는 처음부터 전체 구현할 것인가?
   - 추천: Phase B에서 3개 핵심 에이전트(`fact_mapper`, `corpus_analyst`, `law_verifier`)를 먼저 구현하고, Phase D에서 검토 에이전트를 추가한다.

4. 에이전트 실행은 동기 API로 할 것인가, 작업 큐로 할 것인가?
   - 추천: PoC는 동기 API로 시작하되, 테이블 상태값은 비동기 큐로 옮길 수 있게 설계한다.

5. 최종 초안만 보여줄 것인가, 에이전트별 근거도 보여줄 것인가?
   - 추천: 에이전트별 산출물과 source log를 반드시 보여준다. 이 기능의 신뢰성은 결론보다 검토 경로에서 나온다.

## 14. 구현자가 절대 놓치면 안 되는 점

- 이 도구의 차별점은 "의결례 검색"만이 아니라 "멀티에이전트 검토를 거친 권익위식 의결서 초안"이다.
- 기존 `acrc-search` 구조를 유지해야 하므로 검색 로직과 DB 진입점은 재사용한다.
- `documents.full_text`와 민원 원문은 민감할 수 있으므로 API 응답과 로그에 무분별하게 남기지 않는다.
- 법령 검증 실패를 숨기지 않는다.
- 유사 의결례는 참고 사례이지 사실관계의 출처가 아니다.
- 조사관이 최종 판단권자이며, AI는 초안과 검토 경로를 제공하는 보조자다.

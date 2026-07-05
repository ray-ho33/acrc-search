# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

국민권익위 의결례 시맨틱 검색 웹앱 (MVP). 조사관용 고충처리 자료 검색.
Next.js 16 App Router + TypeScript + Tailwind v4 + Supabase(pgvector) + Gemini `gemini-embedding-001`(1536차원, L2 정규화). Vercel 배포: https://acrc-search.vercel.app/

상세 행동 규칙은 `PRD/04_PROJECT_SPEC.md` 참조 (하드 룰 목록 포함). PRD 폴더에 기획·데이터모델·진행 기록 문서 있음.

## 명령어

```bash
npm run dev          # 개발 서버
npm test             # vitest 전체 실행
npx vitest run tests/rate-limit.test.ts   # 단일 테스트 파일
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # 프로덕션 빌드 (배포 전 필수)

# 데이터 파이프라인 (.env 필요)
npm run ingest -- --max-pages 2   # 의결례 수집 → documents 테이블
npm run embed -- --limit 50       # 임베딩 생성 → document_embeds 테이블
npm run check:db                  # Supabase 상태 확인
```

DB 마이그레이션은 자동 적용되지 않음 — `supabase/migrations/*.sql`을 Supabase 대시보드 SQL Editor에서 번호 순서대로 수동 실행.

## 아키텍처

**검색 흐름**: `components/SearchExperience.tsx`(클라이언트) → `POST /api/search` → `lib/search.ts` → `lib/embed.ts`(Gemini 쿼리 임베딩, 인메모리 LRU 캐시) → Supabase RPC `match_documents`(pgvector cosine, `003_match_documents.sql`) → 결과 카드. 문서 상세는 `app/documents/[id]/page.tsx` 서버 컴포넌트가 직접 조회.

**MCP 엔드포인트**: `POST /api/mcp` — Claude.ai 커스텀 커넥터용 JSON-RPC 2.0. 프로토콜 로직은 `lib/mcp.ts`의 `createMcpHandler`에 의존성 주입 패턴으로 분리되어 라우트 없이 단위 테스트 가능(`tests/mcp-handler.test.ts`). 도구 3개: `health_check`, `search_similar_decisions`, `get_decision_detail`. id 없는 요청은 notification — 응답 없이 202.

**Supabase 접근 규칙**: 모든 클라이언트 생성은 `lib/db.ts` 두 함수만 사용 (직접 `createClient()` 금지). 서버는 `SUPABASE_SERVICE_KEY`(RLS 우회), 브라우저는 anon 키. anon은 `documents` SELECT만 가능 — `feedback`/`users`/`document_embeds`는 006 마이그레이션에서 읽기 회수됨. 환류 쓰기는 `/api/feedback` 서버 라우트 경유만 (005에서 anon INSERT 회수).

**레이트리밋**: `lib/rate-limit.ts` 인메모리 슬라이딩 윈도, `/api/search`(분당 20)·`/api/mcp`(분당 30)에 적용. 서버리스 인스턴스별 한도라는 한계 있음 — 비용 방어 1차 저지선.

**수집 스크립트**: `scripts/*.mjs`는 Next.js와 무관한 독립 Node 스크립트. 공용 로직은 `scripts/lib/`(법제처 API 다운로드, Gemini 임베딩, env 로드). 문서 임베딩도 쿼리와 동일하게 1536차원 + L2 정규화 — 차원이나 정규화를 한쪽만 바꾸면 검색 무너짐.

## 핵심 규칙 (PRD/04 요약)

- API 라우트 에러 응답 형식: `{ error: { message, code } }`. 내부 에러 원문은 클라이언트에 노출하지 않고 서버 로그만.
- `documents.full_text`를 검색 API 응답에 담지 마라 (상세 페이지에서만).
- 환류 메모(`feedback.note`)는 다른 사용자에게 노출 금지 (MVP 정책).
- Gemini API·서비스 키는 서버 사이드 전용. `NEXT_PUBLIC_` 접두사 금지.
- 주석은 "왜"만 — narration 주석 금지.
- 디자인: indigo + slate 톤. 카드/상세에 출처·결정일·원문 링크 필수 표기.
- 컴포넌트는 Server Component 기본, `"use client"`는 상호작용 필요할 때만.

## 남은 조치사항 (TODO)

2026-07-05 개선 세션에서 미처리된 항목. 처리 후 이 목록에서 지울 것.

1. **006 마이그레이션 프로덕션 미적용**: `supabase/migrations/006_restrict_anon_reads.sql`을 Supabase SQL Editor에서 실행해야 anon 읽기 회수 반영됨. 실행 전까지 브라우저 anon 키로 `feedback.note`·`users.email` 조회 가능한 상태.
2. **벡터 인덱스 없음**: `001_init.sql`에 ivfflat 인덱스 주석 처리됨. 데이터 1만 건 도달 시 활성화 (현재는 풀스캔이 의도된 설계).
3. **CI 워크플로 없음**: `.github/workflows` 부재. test + typecheck + lint 실행하는 GitHub Actions 추가 필요.
4. **레이트리미터 전역화**: 인메모리라 인스턴스별 한도. 트래픽 늘면 Upstash 등 외부 저장소 기반으로 교체.
5. **MCP 엔드포인트 무인증**: 레이트리밋만 있고 인증 없음. 공개 유지 여부 정책 결정 필요 — 비공개로 가면 Bearer 토큰 검증 추가.

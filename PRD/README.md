# PRD — 고충처리 자료 검색 지원 시스템

> 이 폴더에는 프로젝트 개발 전 합의한 4종 디자인 문서가 있습니다.
> 코드를 작성하기 전 이 문서들을 한 번 읽어주세요.

## 문서 목록

| 파일 | 내용 | 누가 봐야 하나 |
|------|------|--------------|
| [`01_PRD.md`](./01_PRD.md) | 무엇을 / 누구를 위해 / 왜 만드는지. 목표·범위·MVP 기능·기술 스택. | 사용자 + AI 어시스턴트 |
| [`02_DATA_MODEL.md`](./02_DATA_MODEL.md) | 데이터베이스 스키마. 어떤 테이블이 어떻게 연결되는지. | AI 어시스턴트 (코딩 시 참조) |
| [`03_PHASES.md`](./03_PHASES.md) | Phase 1 → 2 → 3 단계 분리. 각 단계 acceptance criteria. | 사용자 + AI 어시스턴트 |
| [`04_PROJECT_SPEC.md`](./04_PROJECT_SPEC.md) | "절대 하지 마" 목록. 디렉터리 구조. 코드 스타일. | AI 어시스턴트 (모든 변경 시 우선 참조) |
| [`HANDOFF.md`](./HANDOFF.md) | 다른 컴퓨터에서 이어하기 (GitHub 옮기기 가이드). | 사용자 |

## 빠른 요약

- **무엇**: 정부 고충 조사관용 통합 자료 검색 웹앱
- **현 단계**: MVP / 데모 (인터넷 환경, Vercel + Supabase)
- **기술 스택**: Next.js 14 + TypeScript + Tailwind + Supabase(pgvector) + Gemini 임베딩
- **재사용 자산**: 이전 레포 `https://github.com/ray-ho33/jeob-su`의 법제처 API 호출 + Gemini 임베딩 코드
- **Phase 1 목표**: 의결례 ≥ 500건을 시맨틱 검색으로 찾을 수 있는 웹 화면 + Vercel 배포

## 다음 단계

1. 본 PRD를 검토한 뒤 → `/goaljaby` 스킬로 운영 계약서(VALIDATION/RECOVERY/PLAN/PROGRESS) 생성
2. 골 계약서 승인 → Phase 1 개발 시작
3. Phase 1 완료 → 데모 → 피드백 → Phase 2 진입 결정

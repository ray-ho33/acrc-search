// 데이터 모델 타입 정의 — PRD/02_DATA_MODEL.md §3 기준
// DB 컬럼명과 일치시켜 Supabase 응답을 그대로 받아쓸 수 있도록 함.

export type DocumentSource = "권익위" | "법제처" | "행심위" | "대법원";
export type DocumentType = "의결례" | "유권해석" | "재결례" | "판례";

export interface Document {
  id: string;
  source: DocumentSource | string;
  type: DocumentType | string;
  external_id: string;
  title: string;
  agency: string | null;
  decided_at: string | null;
  case_no: string | null;
  summary: string | null;
  full_text: string | null;
  url: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentEmbed {
  document_id: string;
  model: string;
  dimensions: number;
  embedding: number[];
  embedded_at: string;
}

export interface Feedback {
  id: string;
  document_id: string;
  user_id: string | null;
  case_no: string | null;
  helpful: boolean | null;
  note: string;
  created_at: string;
}

// 검색 API 응답용 — full_text 제외 (PRD/04_PROJECT_SPEC.md §3.3 "절대 하지 마")
export type SearchResult = Pick<
  Document,
  "id" | "title" | "source" | "type" | "agency" | "decided_at" | "summary" | "url"
> & {
  score: number;
};

export interface ApiError {
  error: {
    message: string;
    code: string;
  };
}

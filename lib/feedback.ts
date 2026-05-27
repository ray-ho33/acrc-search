export interface ParsedFeedbackRequest {
  document_id: string;
  case_no: string | null;
  helpful: boolean | null;
  note: string;
}

export class FeedbackValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedbackValidationError";
  }
}

function requiredString(value: unknown, message: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new FeedbackValidationError(message);
  return text;
}

function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text : null;
}

function optionalHelpful(value: unknown): boolean | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value;
  throw new FeedbackValidationError("도움 여부 값이 올바르지 않습니다.");
}

export function parseFeedbackRequest(body: unknown): ParsedFeedbackRequest {
  const data =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  return {
    document_id: requiredString(data.document_id, "문서 ID가 필요합니다."),
    case_no: optionalString(data.case_no),
    helpful: optionalHelpful(data.helpful),
    note: requiredString(data.note, "환류 메모를 입력해주세요."),
  };
}

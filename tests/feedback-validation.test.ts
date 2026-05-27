import { describe, expect, it } from "vitest";
import { parseFeedbackRequest } from "@/lib/feedback";

describe("parseFeedbackRequest", () => {
  it("accepts a useful feedback request", () => {
    expect(
      parseFeedbackRequest({
        document_id: "5b4b6296-48b5-4d5a-97dd-b96f81b0e918f",
        case_no: "2024-123",
        helpful: true,
        note: "민원 검토에 도움이 됐습니다.",
      })
    ).toEqual({
      document_id: "5b4b6296-48b5-4d5a-97dd-b96f81b0e918f",
      case_no: "2024-123",
      helpful: true,
      note: "민원 검토에 도움이 됐습니다.",
    });
  });

  it("rejects an empty note", () => {
    expect(() =>
      parseFeedbackRequest({
        document_id: "5b4b6296-48b5-4d5a-97dd-b96f81b0e918f",
        note: "   ",
      })
    ).toThrow("환류 메모를 입력해주세요.");
  });

  it("normalizes optional empty fields to null", () => {
    expect(
      parseFeedbackRequest({
        document_id: "5b4b6296-48b5-4d5a-97dd-b96f81b0e918f",
        case_no: "",
        helpful: null,
        note: "추가 검토 필요",
      })
    ).toEqual({
      document_id: "5b4b6296-48b5-4d5a-97dd-b96f81b0e918f",
      case_no: null,
      helpful: null,
      note: "추가 검토 필요",
    });
  });

  it("rejects an invalid helpful value", () => {
    expect(() =>
      parseFeedbackRequest({
        document_id: "5b4b6296-48b5-4d5a-97dd-b96f81b0e918f",
        helpful: "unknown",
        note: "추가 검토 필요",
      })
    ).toThrow("도움 여부 값이 올바르지 않습니다.");
  });
});

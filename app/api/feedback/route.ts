import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db";
import { FeedbackValidationError, parseFeedbackRequest } from "@/lib/feedback";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "요청 JSON 형식이 올바르지 않습니다.", code: "BAD_JSON" } },
      { status: 400 }
    );
  }

  try {
    const feedback = parseFeedbackRequest(body);
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        document_id: feedback.document_id,
        user_id: null,
        case_no: feedback.case_no,
        helpful: feedback.helpful,
        note: feedback.note,
      })
      .select("id, document_id, case_no, helpful, note, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ feedback: data }, { status: 201 });
  } catch (error) {
    if (error instanceof FeedbackValidationError) {
      return NextResponse.json(
        { error: { message: error.message, code: "BAD_FEEDBACK_REQUEST" } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: {
          message: "환류 저장 중 서버 오류가 발생했습니다.",
          code: "FEEDBACK_SAVE_FAILED",
        },
      },
      { status: 500 }
    );
  }
}

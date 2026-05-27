"use client";

import { useState } from "react";
import type { FormEvent } from "react";

interface FeedbackFormProps {
  documentId: string;
  defaultCaseNo: string | null;
}

type HelpfulChoice = "yes" | "no" | "unknown";

function helpfulValue(choice: HelpfulChoice): boolean | null {
  if (choice === "yes") return true;
  if (choice === "no") return false;
  return null;
}

export function FeedbackForm({ documentId, defaultCaseNo }: FeedbackFormProps) {
  const [caseNo, setCaseNo] = useState(defaultCaseNo ?? "");
  const [helpful, setHelpful] = useState<HelpfulChoice>("unknown");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: documentId,
          case_no: caseNo,
          helpful: helpfulValue(helpful),
          note,
        }),
      });

      const data = (await response.json()) as {
        error?: { message?: string };
      };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error?.message ?? "환류 저장에 실패했습니다.");
        return;
      }

      setStatus("saved");
      setMessage("환류가 저장되었습니다.");
      setNote("");
    } catch {
      setStatus("error");
      setMessage("네트워크 오류로 환류 저장에 실패했습니다.");
    }
  }

  const isSaving = status === "saving";

  return (
    <section className="mt-8 rounded-3xl border border-indigo-100 bg-indigo-50/60 p-5">
      <h2 className="text-lg font-semibold text-slate-950">환류 입력</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        이 자료가 실제 민원 검토에 도움이 됐는지 남겨두면, 다음 단계에서 검색 품질
        개선 자료로 사용할 수 있습니다.
      </p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            className="text-sm font-semibold text-slate-800"
            htmlFor="feedback-case-no"
          >
            사건번호
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            id="feedback-case-no"
            onChange={(event) => setCaseNo(event.target.value)}
            placeholder="예: 2024-123"
            type="text"
            value={caseNo}
          />
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">
            이 자료가 도움이 되었나요?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              ["yes", "도움 됨"],
              ["no", "도움 안 됨"],
              ["unknown", "아직 모름"],
            ].map(([value, label]) => (
              <label
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                key={value}
              >
                <input
                  checked={helpful === value}
                  name="helpful"
                  onChange={() => setHelpful(value as HelpfulChoice)}
                  type="radio"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            className="text-sm font-semibold text-slate-800"
            htmlFor="feedback-note"
          >
            환류 메모
          </label>
          <textarea
            className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            id="feedback-note"
            onChange={(event) => setNote(event.target.value)}
            placeholder="왜 도움이 되었는지, 어떤 점이 부족했는지 적어주세요."
            required
            value={note}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-full bg-indigo-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "저장 중..." : "환류 저장"}
          </button>
          {message ? (
            <p
              className={
                status === "error"
                  ? "text-sm font-medium text-red-600"
                  : "text-sm font-medium text-emerald-700"
              }
            >
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}

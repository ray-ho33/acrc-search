import Link from "next/link";
import { notFound } from "next/navigation";
import { FeedbackForm } from "@/components/FeedbackForm";
import { createServerSupabaseClient } from "@/lib/db";
import type { Document } from "@/lib/types";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(value: string | null): string {
  if (!value) return "결정일 미상";
  return value.slice(0, 10);
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const document = data as Document;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <article className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <Link
          className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
          href="/"
        >
          ← 검색으로 돌아가기
        </Link>

        <div className="mt-8 flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
            {document.source}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            {document.type}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            {formatDate(document.decided_at)}
          </span>
        </div>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
          {document.title}
        </h1>

        <dl className="mt-6 grid gap-3 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-900">기관</dt>
            <dd className="mt-1">{document.agency || "미상"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">사건번호</dt>
            <dd className="mt-1">{document.case_no || "미상"}</dd>
          </div>
        </dl>

        {document.summary ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-950">요약</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
              {document.summary}
            </p>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">저장 원문</h2>
          <p className="mt-3 text-sm text-slate-500">
            M2 수집 단계에서 DB에 저장한 본문입니다. 외부 API 키를 브라우저에
            노출하지 않기 위해 앱 내부에서 보여줍니다.
          </p>
          <div className="mt-4 max-h-[70vh] overflow-auto rounded-3xl border border-slate-200 bg-white p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {document.full_text || "저장된 원문이 없습니다."}
            </p>
          </div>
        </section>

        <FeedbackForm documentId={document.id} defaultCaseNo={document.case_no} />
      </article>
    </main>
  );
}

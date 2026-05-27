import Link from "next/link";
import type { SearchResult } from "@/lib/types";

interface ResultCardProps {
  result: SearchResult;
}

function formatDate(value: string | null): string {
  if (!value) return "결정일 미상";
  return value.slice(0, 10);
}

function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function ResultCard({ result }: ResultCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
          {result.source}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
          {result.type}
        </span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
          유사도 {formatScore(result.score)}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-7 text-slate-950">
        {result.title}
      </h3>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
        {result.summary || "요약이 없는 자료입니다. 상세 화면은 M4에서 연결합니다."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
        <span>기관: {result.agency || "미상"}</span>
        <span>결정일: {formatDate(result.decided_at)}</span>
      </div>

      <Link
        className="mt-4 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-900"
        href={`/documents/${result.id}`}
      >
        저장 원문 보기
      </Link>
    </article>
  );
}

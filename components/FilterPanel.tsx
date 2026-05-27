"use client";

interface FilterPanelProps {
  type: string;
  year: string;
  onTypeChange: (type: string) => void;
  onYearChange: (year: string) => void;
}

const YEARS = ["all", "2025", "2024", "2023", "2022", "2021", "2020"];

export function FilterPanel({
  type,
  year,
  onTypeChange,
  onYearChange,
}: FilterPanelProps) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">필터</h2>
      <p className="mt-1 text-sm text-slate-500">
        M3에서는 의결례 데이터부터 검색합니다.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">자료 종류</span>
          <select
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            value={type}
            onChange={(event) => onTypeChange(event.target.value)}
          >
            <option value="all">전체</option>
            <option value="의결례">의결례</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">결정 연도</span>
          <select
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            value={year}
            onChange={(event) => onYearChange(event.target.value)}
          >
            {YEARS.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "전체" : value}
              </option>
            ))}
          </select>
        </label>
      </div>
    </aside>
  );
}

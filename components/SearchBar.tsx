"use client";

interface SearchBarProps {
  query: string;
  isLoading: boolean;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
}

export function SearchBar({
  query,
  isLoading,
  onQueryChange,
  onSubmit,
}: SearchBarProps) {
  return (
    <form
      className="flex flex-col gap-3 rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="sr-only" htmlFor="search-query">
        검색어
      </label>
      <input
        id="search-query"
        className="min-h-12 flex-1 rounded-2xl border border-slate-200 px-4 text-base text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
        placeholder="예: 층간소음, 공무원 징계, 영업정지"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <button
        className="min-h-12 rounded-2xl bg-indigo-600 px-6 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "검색 중..." : "검색"}
      </button>
    </form>
  );
}

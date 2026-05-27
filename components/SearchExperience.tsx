"use client";

import { useCallback, useState } from "react";
import { FilterPanel } from "@/components/FilterPanel";
import { ResultCard } from "@/components/ResultCard";
import { SearchBar } from "@/components/SearchBar";
import type { SearchResult } from "@/lib/types";

interface SearchApiResponse {
  results?: SearchResult[];
  error?: {
    message: string;
    code: string;
  };
}

export function SearchExperience() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [year, setYear] = useState("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState("");

  const executeSearch = useCallback(async (searchQuery: string, nextType: string, nextYear: string) => {
    const trimmed = searchQuery.trim();
    setHasSearched(true);
    setError(null);

    if (!trimmed) {
      setResults([]);
      setError("검색어를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: trimmed,
          filters: {
            type: nextType,
            year: nextYear,
          },
          limit: 10,
        }),
      });

      const data = (await response.json()) as SearchApiResponse;
      if (!response.ok) {
        throw new Error(data.error?.message || "검색 요청에 실패했습니다.");
      }

      setResults(data.results ?? []);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "검색 중 오류가 발생했습니다.";
      setResults([]);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function runSearch() {
    const trimmed = query.trim();
    if (!trimmed) {
      setLastSubmittedQuery("");
      await executeSearch(trimmed, type, year);
      return;
    }

    if (trimmed === lastSubmittedQuery) {
      await executeSearch(trimmed, type, year);
      return;
    }

    setLastSubmittedQuery(trimmed);
  }

  function handleTypeChange(nextType: string) {
    setType(nextType);
    if (lastSubmittedQuery) {
      void executeSearch(lastSubmittedQuery, nextType, year);
    }
  }

  function handleYearChange(nextYear: string) {
    setYear(nextYear);
    if (lastSubmittedQuery) {
      void executeSearch(lastSubmittedQuery, type, nextYear);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <FilterPanel
        type={type}
        year={year}
        onTypeChange={handleTypeChange}
        onYearChange={handleYearChange}
      />

      <section className="space-y-5">
        <SearchBar
          query={query}
          isLoading={isLoading}
          onQueryChange={setQuery}
          onSubmit={runSearch}
        />

        {error ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!hasSearched ? (
          <div className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/60 p-8 text-center">
            <p className="text-sm font-medium text-indigo-900">
              검색어를 입력하면 M2에서 적재한 의결례 임베딩과 비교합니다.
            </p>
            <p className="mt-2 text-sm text-indigo-700">
              예시: 층간소음, 퇴직금, 공무원 징계
            </p>
          </div>
        ) : null}

        {hasSearched && !isLoading && !error && results.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            검색 결과가 없습니다. 다른 표현으로 다시 검색해보세요.
          </div>
        ) : null}

        {results.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-slate-500">
              총 {results.length}건을 찾았습니다.
            </div>
            {results.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

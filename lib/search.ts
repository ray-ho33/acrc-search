import { createServerSupabaseClient } from "@/lib/db";
import { embedSearchQuery } from "@/lib/embed";
import type { SearchResult } from "@/lib/types";

export interface SearchFilters {
  type?: string;
  year?: number;
}

export interface SearchDocumentsOptions {
  filters?: SearchFilters;
  limit?: number;
}

interface MatchDocumentRow {
  id: string;
  title: string;
  source: string;
  type: string;
  agency: string | null;
  decided_at: string | null;
  summary: string | null;
  url: string | null;
  score: number;
}

function normalizeLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return 10;
  return Math.max(1, Math.min(Math.trunc(limit ?? 10), 20));
}

export async function searchDocuments(
  query: string,
  options: SearchDocumentsOptions = {}
): Promise<SearchResult[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const embedding = await embedSearchQuery(normalizedQuery);
  const supabase = createServerSupabaseClient();
  const filters = options.filters ?? {};

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: normalizeLimit(options.limit),
    filter_type: filters.type && filters.type !== "all" ? filters.type : null,
    filter_year: filters.year ?? null,
  });

  if (error) {
    throw new Error(`검색 RPC 실패: ${error.message}`);
  }

  return ((data ?? []) as MatchDocumentRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    source: row.source,
    type: row.type,
    agency: row.agency,
    decided_at: row.decided_at,
    summary: row.summary,
    url: row.url,
    score: row.score,
  }));
}

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db";
import { createMcpHandler } from "@/lib/mcp";
import type { JsonRpcRequest } from "@/lib/mcp";
import { searchDocuments } from "@/lib/search";
import type { Document } from "@/lib/types";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 1536;

const handler = createMcpHandler({
  async getHealthStatus() {
    const supabase = createServerSupabaseClient();
    const { count, error } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    return {
      ok: true,
      documentCount: count ?? 0,
      embeddingModel: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    };
  },

  async searchSimilarDecisions(query, options) {
    return searchDocuments(query, { limit: options.limit });
  },

  async getDecisionDetail(id) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as Document | null;
  },
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await handler(body as JsonRpcRequest));
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: "Internal error" },
      },
      { status: 500 }
    );
  }
}

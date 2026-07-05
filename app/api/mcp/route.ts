import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db";
import { createMcpHandler } from "@/lib/mcp";
import type { JsonRpcRequest } from "@/lib/mcp";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { searchDocuments } from "@/lib/search";
import type { Document } from "@/lib/types";

// MCP 클라이언트는 initialize/tools 핸드셰이크까지 포함하므로 검색 UI보다 여유 있게
const rateLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });

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
  const rate = rateLimiter.check(getClientIp(request));
  if (!rate.allowed) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32000, message: "Rate limit exceeded. Retry later." },
      },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

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
    const response = await handler(body as JsonRpcRequest);
    if (response === null) {
      // JSON-RPC notification — 응답 본문 없이 수신만 확인
      return new Response(null, { status: 202 });
    }
    return NextResponse.json(response);
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

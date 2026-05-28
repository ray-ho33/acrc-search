import type { Document, SearchResult } from "./types";

export interface HealthStatus {
  ok: boolean;
  documentCount: number;
  embeddingModel: string;
  dimensions: number;
}

export interface McpDependencies {
  getHealthStatus: () => Promise<HealthStatus>;
  searchSimilarDecisions: (
    query: string,
    options: { limit?: number }
  ) => Promise<SearchResult[]>;
  getDecisionDetail: (id: string) => Promise<Document | null>;
}

export interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: {
    protocolVersion?: string;
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRequestId(value: unknown): string | number | null {
  if (!isRecord(value)) return null;
  return typeof value.id === "string" || typeof value.id === "number" || value.id === null
    ? value.id
    : null;
}

function textContent(text: string) {
  return {
    content: [{ type: "text", text }],
  };
}

function success(id: JsonRpcRequest["id"], result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function failure(
  id: JsonRpcRequest["id"],
  code: number,
  message: string
): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return "검색 결과가 없습니다.";

  return results
    .map((result, index) => {
      const score =
        typeof result.score === "number" ? result.score.toFixed(3) : "N/A";
      return [
        `${index + 1}. ${result.title}`,
        `ID: ${result.id}`,
        `출처: ${result.source} / ${result.type}`,
        result.agency ? `기관: ${result.agency}` : undefined,
        result.decided_at ? `결정일: ${result.decided_at}` : undefined,
        result.summary ? `요약: ${result.summary}` : undefined,
        `유사도: ${score}`,
        result.url ? `URL: ${result.url}` : undefined,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function formatDecisionDetail(document: Document | null): string {
  if (!document) return "해당 ID의 결정례를 찾을 수 없습니다.";

  return [
    `제목: ${document.title}`,
    `ID: ${document.id}`,
    `출처: ${document.source} / ${document.type}`,
    document.case_no ? `사건번호: ${document.case_no}` : undefined,
    document.agency ? `기관: ${document.agency}` : undefined,
    document.decided_at ? `결정일: ${document.decided_at}` : undefined,
    document.summary ? `요약: ${document.summary}` : undefined,
    document.full_text ? `전문:\n${document.full_text}` : undefined,
    document.url ? `URL: ${document.url}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}

export function createMcpHandler(dependencies: McpDependencies) {
  return async function handleMcpRequest(
    request: unknown
  ): Promise<JsonRpcResponse> {
    if (!isRecord(request)) {
      return failure(null, -32600, "Invalid Request");
    }

    const id = getRequestId(request);
    const method = typeof request.method === "string" ? request.method : undefined;
    const params = isRecord(request.params) ? request.params : undefined;

    if (request.jsonrpc !== "2.0" || !method) {
      return failure(id, -32600, "Invalid Request");
    }

    switch (method) {
      case "initialize":
        return success(id, {
          protocolVersion:
            typeof params?.protocolVersion === "string" ? params.protocolVersion : "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "acrc-search-mcp",
            version: "0.1.0",
          },
        });

      case "tools/list":
        return success(id, {
          tools: [
            {
              name: "health_check",
              description: "Check the ACRC search service health.",
              inputSchema: {
                type: "object",
                properties: {},
              },
            },
            {
              name: "search_similar_decisions",
              description: "Search similar ACRC decisions by natural language query.",
              inputSchema: {
                type: "object",
                properties: {
                  query: { type: "string" },
                  limit: { type: "number" },
                },
                required: ["query"],
              },
            },
            {
              name: "get_decision_detail",
              description: "Get a full decision document by id.",
              inputSchema: {
                type: "object",
                properties: {
                  id: { type: "string" },
                },
                required: ["id"],
              },
            },
          ],
        });

      case "tools/call": {
        const toolName = typeof params?.name === "string" ? params.name : undefined;
        const args = isRecord(params?.arguments) ? params.arguments : {};

        if (toolName === "health_check") {
          const status = await dependencies.getHealthStatus();
          return success(id, textContent(JSON.stringify(status, null, 2)));
        }

        if (toolName === "search_similar_decisions") {
          if (typeof args.query !== "string" || args.query.trim() === "") {
            return failure(id, -32602, "search_similar_decisions requires a non-empty query");
          }
          const query = args.query.trim();
          const limit = typeof args.limit === "number" ? args.limit : undefined;
          const results = await dependencies.searchSimilarDecisions(query, {
            limit,
          });
          return success(id, textContent(formatSearchResults(results)));
        }

        if (toolName === "get_decision_detail") {
          if (typeof args.id !== "string" || args.id.trim() === "") {
            return failure(id, -32602, "get_decision_detail requires a non-empty id");
          }
          const document = await dependencies.getDecisionDetail(args.id.trim());
          return success(id, textContent(formatDecisionDetail(document)));
        }

        return failure(id, -32602, "Unknown tool");
      }

      default:
        return failure(id, -32601, "Method not found");
    }
  };
}

import { describe, expect, it } from "vitest";
import { createMcpHandler } from "../lib/mcp";
import type { Document, SearchResult } from "../lib/types";

type ToolListResult = { tools: Array<{ name: string }> };
type ToolCallResult = { content: Array<{ type: "text"; text: string }> };

const sampleSearchResult: SearchResult = {
  id: "5b4b6296-48b5-4d5a-97dd-b96f81b0e918f",
  title: "초등학교 앞 횡단보도 설치 요구",
  source: "권익위",
  type: "의결례",
  agency: "국민권익위원회",
  decided_at: "2024-01-10",
  summary: "통학로 보행 안전시설 설치 필요성을 검토한 사례",
  url: "https://example.test/decision/1",
  score: 0.87,
};

const sampleDetail: Document = {
  ...sampleSearchResult,
  external_id: "ACR-1",
  case_no: "2024-민원-1",
  full_text: "결정문 전문",
  tags: ["통학로", "보행안전"],
  created_at: "2026-05-28T00:00:00Z",
  updated_at: "2026-05-28T00:00:00Z",
};

function makeHandler() {
  return createMcpHandler({
    async getHealthStatus() {
      return {
        ok: true,
        documentCount: 640,
        embeddingModel: "gemini-embedding-001",
        dimensions: 1536,
      };
    },
    async searchSimilarDecisions(query, options) {
      expect(query).toBe("통학로 횡단보도 설치 민원");
      expect(options.limit).toBe(5);
      return [sampleSearchResult];
    },
    async getDecisionDetail(id) {
      expect(id).toBe(sampleDetail.id);
      return sampleDetail;
    },
  });
}

describe("MCP handler", () => {
  it("responds to initialize with MCP server metadata", async () => {
    const response = await makeHandler()({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05" },
    });

    expect(response).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      result: {
        protocolVersion: "2024-11-05",
        serverInfo: { name: "acrc-search-mcp" },
      },
    });
  });

  it("lists health, search, and detail tools", async () => {
    const response = await makeHandler()({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    });

    const result = response.result as ToolListResult;
    const toolNames = result.tools.map((tool) => tool.name);
    expect(toolNames).toEqual([
      "health_check",
      "search_similar_decisions",
      "get_decision_detail",
    ]);
  });

  it("calls search_similar_decisions and returns MCP text content", async () => {
    const response = await makeHandler()({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "search_similar_decisions",
        arguments: {
          query: "통학로 횡단보도 설치 민원",
          limit: 5,
        },
      },
    });

    const result = response.result as ToolCallResult;
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("초등학교 앞 횡단보도 설치 요구");
    expect(result.content[0].text).toContain("0.870");
  });

  it("calls get_decision_detail and includes full text", async () => {
    const response = await makeHandler()({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "get_decision_detail",
        arguments: { id: sampleDetail.id },
      },
    });

    const result = response.result as ToolCallResult;
    expect(result.content[0].text).toContain("결정문 전문");
    expect(result.content[0].text).toContain("2024-민원-1");
  });

  it("rejects search calls without a query", async () => {
    const response = await makeHandler()({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "search_similar_decisions",
        arguments: { limit: 5 },
      },
    });

    expect(response.error).toMatchObject({ code: -32602 });
  });

  it("rejects detail calls without an id", async () => {
    const response = await makeHandler()({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "get_decision_detail",
        arguments: {},
      },
    });

    expect(response.error).toMatchObject({ code: -32602 });
  });

  it("returns invalid request for non-object JSON-RPC payloads", async () => {
    const response = await makeHandler()(null);

    expect(response.error).toMatchObject({ code: -32600 });
  });

  it("returns JSON-RPC error for an unknown method", async () => {
    const response = await makeHandler()({
      jsonrpc: "2.0",
      id: 7,
      method: "unknown/method",
    });

    expect(response.error).toMatchObject({ code: -32601 });
  });
});

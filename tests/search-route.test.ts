import { describe, expect, it } from "vitest";
import { POST } from "../app/api/search/route";

// 검증 실패 케이스만 다룬다. searchDocuments 호출 전에 응답이 반환되므로
// Gemini/Supabase 환경변수 없이 실행 가능하다.

let ipCounter = 0;

function makeRequest(body: string, ip?: string) {
  ipCounter += 1;
  return new Request("http://localhost/api/search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // 테스트 간 레이트리미터 간섭을 막기 위해 기본은 요청마다 다른 IP 사용
      "x-forwarded-for": ip ?? `198.51.100.${ipCounter}`,
    },
    body,
  });
}

describe("POST /api/search validation", () => {
  it("returns 400 BAD_JSON for malformed JSON", async () => {
    const response = await POST(makeRequest("{oops"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("BAD_JSON");
  });

  it("returns 400 EMPTY_QUERY for a missing query", async () => {
    const response = await POST(makeRequest(JSON.stringify({ q: "   " })));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("EMPTY_QUERY");
  });

  it("returns 400 BAD_REQUEST for an out-of-range year", async () => {
    const response = await POST(
      makeRequest(JSON.stringify({ q: "층간소음", filters: { year: 1800 } }))
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("BAD_REQUEST");
  });

  it("returns 400 BAD_REQUEST for an out-of-range limit", async () => {
    const response = await POST(
      makeRequest(JSON.stringify({ q: "층간소음", limit: 999 }))
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("BAD_REQUEST");
  });

  it("returns 429 with Retry-After once the per-IP limit is exhausted", async () => {
    const ip = "203.0.113.200";

    for (let i = 0; i < 20; i += 1) {
      const response = await POST(makeRequest(JSON.stringify({ q: "" }), ip));
      expect(response.status).toBe(400);
    }

    const blocked = await POST(makeRequest(JSON.stringify({ q: "" }), ip));
    const data = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(data.error.code).toBe("RATE_LIMITED");
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
  });
});

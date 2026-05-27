import { NextResponse } from "next/server";
import { searchDocuments } from "@/lib/search";

interface SearchRequestBody {
  q?: unknown;
  filters?: {
    type?: unknown;
    year?: unknown;
  };
  limit?: unknown;
}

function parseYear(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "" || value === "all") {
    return undefined;
  }
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error("연도 필터는 1900~2100 사이의 숫자여야 합니다.");
  }
  return year;
}

function parseLimit(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new Error("limit은 1~20 사이의 숫자여야 합니다.");
  }
  return limit;
}

export async function POST(request: Request) {
  let body: SearchRequestBody;
  try {
    body = (await request.json()) as SearchRequestBody;
  } catch {
    return NextResponse.json(
      { error: { message: "요청 JSON 형식이 올바르지 않습니다.", code: "BAD_JSON" } },
      { status: 400 }
    );
  }

  const query = typeof body.q === "string" ? body.q.trim() : "";
  if (!query) {
    return NextResponse.json(
      {
        error: {
          message: "검색어를 입력해주세요.",
          code: "EMPTY_QUERY",
        },
      },
      { status: 400 }
    );
  }

  try {
    const results = await searchDocuments(query, {
      filters: {
        type:
          typeof body.filters?.type === "string" && body.filters.type !== "all"
            ? body.filters.type
            : undefined,
        year: parseYear(body.filters?.year),
      },
      limit: parseLimit(body.limit),
    });

    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "검색 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json(
      { error: { message, code: "SEARCH_FAILED" } },
      { status: 500 }
    );
  }
}

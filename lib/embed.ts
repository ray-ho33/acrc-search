const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIMENSIONS = 1536;
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `[env] ${name} 가 .env 에 설정되지 않았습니다. .env.example 을 참고해 채워주세요.`
    );
  }
  return value;
}

function l2Normalize(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) return values.slice();
  return values.map((value) => value / norm);
}

// 동일 검색어 반복 시 Gemini 재호출을 막는 인메모리 LRU 캐시.
// 임베딩은 모델이 같으면 결정적이므로 TTL 없이 크기 상한만 둔다.
const CACHE_MAX_ENTRIES = 500;
const embeddingCache = new Map<string, number[]>();

function getCachedEmbedding(query: string): number[] | undefined {
  const cached = embeddingCache.get(query);
  if (!cached) return undefined;
  // Map 삽입 순서를 LRU 순서로 사용: 조회 시 맨 뒤로 보낸다
  embeddingCache.delete(query);
  embeddingCache.set(query, cached);
  return cached;
}

function setCachedEmbedding(query: string, values: number[]): void {
  embeddingCache.set(query, values);
  if (embeddingCache.size > CACHE_MAX_ENTRIES) {
    const oldest = embeddingCache.keys().next().value;
    if (oldest !== undefined) embeddingCache.delete(oldest);
  }
}

export async function embedSearchQuery(query: string): Promise<number[]> {
  const cached = getCachedEmbedding(query);
  if (cached) return cached;

  const apiKey = requireEnv("GEMINI_API_KEY");
  const url = `${GEMINI_BASE_URL}/models/${EMBED_MODEL}:embedContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      content: { parts: [{ text: query }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: EMBED_DIMENSIONS,
    }),
  });

  const raw = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `Gemini 응답 JSON 파싱 실패: HTTP ${response.status} — ${raw.slice(0, 200)}`
    );
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "object" &&
      data.error !== null &&
      "message" in data.error
        ? String(data.error.message)
        : raw.slice(0, 300);
    throw new Error(`Gemini 임베딩 실패: HTTP ${response.status} — ${message}`);
  }

  const values =
    typeof data === "object" &&
    data !== null &&
    "embedding" in data &&
    typeof data.embedding === "object" &&
    data.embedding !== null &&
    "values" in data.embedding &&
    Array.isArray(data.embedding.values)
      ? data.embedding.values.map(Number)
      : null;

  if (!values || values.length === 0) {
    throw new Error("Gemini 응답에 embedding.values 가 없습니다.");
  }

  const normalized = l2Normalize(values);
  setCachedEmbedding(query, normalized);
  return normalized;
}

// 간단한 인메모리 슬라이딩 윈도 레이트리미터.
// 검색/MCP 요청마다 Gemini 임베딩 API 호출이 발생하므로 무제한 공개 호출을 막는다.
//
// 한계: 인스턴스별 메모리라 서버리스 다중 인스턴스에서는 인스턴스 수만큼
// 한도가 곱해진다. 비용 폭주를 막는 1차 방어선 용도이며, 정밀한 전역 한도가
// 필요해지면 Upstash 등 외부 저장소 기반으로 교체한다.

export interface RateLimitResult {
  allowed: boolean;
  /** allowed=false 일 때 재시도까지 남은 시간(초, 올림) */
  retryAfterSeconds: number;
}

export interface RateLimiterOptions {
  /** 윈도 길이(ms) */
  windowMs: number;
  /** 윈도 내 허용 요청 수 */
  max: number;
  /** 추적할 키(IP) 상한. 초과 시 가장 오래된 키부터 제거 */
  maxKeys?: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { windowMs, max, maxKeys = 5000 } = options;
  // key → 윈도 내 요청 타임스탬프(ms) 목록. Map은 삽입 순서를 유지하므로
  // 상한 초과 시 첫 키를 지우면 대략 LRU처럼 동작한다.
  const hits = new Map<string, number[]>();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const cutoff = now - windowMs;

      const timestamps = (hits.get(key) ?? []).filter((t) => t > cutoff);

      if (timestamps.length >= max) {
        const oldest = timestamps[0];
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
        };
      }

      timestamps.push(now);
      hits.delete(key);
      hits.set(key, timestamps);

      if (hits.size > maxKeys) {
        const firstKey = hits.keys().next().value;
        if (firstKey !== undefined) hits.delete(firstKey);
      }

      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

/** 프록시 뒤에서 클라이언트 IP 추출. Vercel은 x-forwarded-for 첫 값이 클라이언트다. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter, getClientIp } from "../lib/rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the max within a window", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });

    expect(limiter.check("ip-1").allowed).toBe(true);
    expect(limiter.check("ip-1").allowed).toBe(true);
    expect(limiter.check("ip-1").allowed).toBe(true);
  });

  it("blocks requests beyond the max and reports retry-after", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });

    limiter.check("ip-1");
    limiter.check("ip-1");
    const blocked = limiter.check("ip-1");

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });

    expect(limiter.check("ip-1").allowed).toBe(true);
    expect(limiter.check("ip-2").allowed).toBe(true);
    expect(limiter.check("ip-1").allowed).toBe(false);
  });

  it("allows again after the window passes", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });

    expect(limiter.check("ip-1").allowed).toBe(true);
    expect(limiter.check("ip-1").allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(limiter.check("ip-1").allowed).toBe(true);
  });

  it("evicts the oldest key when maxKeys is exceeded", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1, maxKeys: 2 });

    limiter.check("ip-1");
    limiter.check("ip-2");
    limiter.check("ip-3"); // ip-1 제거됨

    expect(limiter.check("ip-1").allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("returns the first x-forwarded-for entry", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });

    expect(getClientIp(request)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    const request = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.7" },
    });

    expect(getClientIp(request)).toBe("198.51.100.7");
  });

  it("returns unknown when no headers are present", () => {
    const request = new Request("http://localhost");

    expect(getClientIp(request)).toBe("unknown");
  });
});

/**
 * Supabase JWT 키의 role 클레임 확인 (키 값 전체는 로그하지 않음)
 * @param {string} key
 * @returns {string | null}
 */
export function jwtRole(key) {
  if (!key || typeof key !== "string") return null;
  const parts = key.trim().split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 */
export function assertServiceRoleKey(key) {
  const role = jwtRole(key);
  if (role === "anon") {
    throw new Error(
      "[env] SUPABASE_SERVICE_KEY 에 anon(공개) 키가 들어 있습니다.\n" +
        "Supabase 대시보드 > Project Settings > API > service_role (secret) 키를 복사해 넣으세요.\n" +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY 와 같은 값이면 안 됩니다.",
    );
  }
}

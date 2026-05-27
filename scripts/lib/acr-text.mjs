/**
 * 권익위 결정문 JSON → 검색·저장용 텍스트 (jeob-su acr-index-build 와 동일 규칙)
 */

const MAX_REASON_CHARS = 10_000;

/**
 * @param {Record<string, unknown>} decision
 * @returns {string}
 */
export function buildSearchText(decision) {
  const parts = [];
  const keys = ["제목", "민원표시", "결정요지", "주문"];
  for (const k of keys) {
    const v = decision[k];
    if (v && String(v).trim()) parts.push(`[${k}]\n${String(v).trim()}`);
  }
  const reason = decision["이유"];
  if (reason && String(reason).trim()) {
    let r = String(reason).trim();
    if (r.length > MAX_REASON_CHARS) {
      r = r.slice(0, MAX_REASON_CHARS) + "\n…(이하 생략)";
    }
    parts.push(`[이유]\n${r}`);
  }
  return parts.join("\n\n").trim();
}

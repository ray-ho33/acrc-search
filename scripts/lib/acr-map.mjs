import { buildSearchText } from "./acr-text.mjs";

/**
 * @param {number} y
 * @param {number} mo
 * @param {number} d
 */
function isValidDateParts(y, mo, d) {
  if (y < 1900 || y > 2100) return false;
  if (mo < 1 || mo > 12) return false;
  if (d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d
  );
}

/**
 * 법제처 API 에서 "2023-06-00" 같이 일(day)이 00 인 값이 올 수 있음 → null 로 처리
 * @param {string | undefined} raw
 * @returns {string | null} YYYY-MM-DD
 */
export function parseDecidedAt(raw) {
  if (!raw) return null;
  const s = String(raw).trim().replace(/\./g, "-");
  let y;
  let mo;
  let d;

  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    y = Number(m[1]);
    mo = Number(m[2]);
    d = Number(m[3]);
  } else {
    const digits = s.replace(/\D/g, "");
    if (digits.length !== 8) return null;
    y = Number(digits.slice(0, 4));
    mo = Number(digits.slice(4, 6));
    d = Number(digits.slice(6, 8));
  }

  if (!isValidDateParts(y, mo, d)) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * @param {string} externalId
 * @param {object} data AcrService JSON
 * @param {{ 사건명?: string, 사건번호?: string, 결정일자?: string }} [listMeta]
 */
export function mapAcrJsonToDocumentRow(externalId, data, listMeta = {}) {
  const decision = data?.AcrService?.의결서;
  if (!decision || typeof decision !== "object") return null;

  const title =
    (decision["제목"] && String(decision["제목"]).trim()) ||
    listMeta.사건명 ||
    `의결례 ${externalId}`;

  const summary =
    decision["결정요지"] && String(decision["결정요지"]).trim()
      ? String(decision["결정요지"]).trim()
      : null;

  const fullText = buildSearchText(decision) || null;
  const decidedRaw =
    decision["결정일자"] ||
    decision["의결일"] ||
    listMeta.결정일자 ||
    null;

  const url =
    (decision["원문URL"] && String(decision["원문URL"]).trim()) ||
    (decision["링크"] && String(decision["링크"]).trim()) ||
    `https://www.law.go.kr/DRF/lawService.do?OC=test&target=acr&type=HTML&ID=${externalId}`;

  return {
    source: "권익위",
    type: "의결례",
    external_id: String(externalId),
    title,
    agency:
      (decision["처분청"] && String(decision["처분청"]).trim()) ||
      (decision["소관부처"] && String(decision["소관부처"]).trim()) ||
      null,
    decided_at: parseDecidedAt(decidedRaw),
    case_no:
      (decision["사건번호"] && String(decision["사건번호"]).trim()) ||
      listMeta.사건번호 ||
      null,
    summary,
    full_text: fullText,
    url,
  };
}

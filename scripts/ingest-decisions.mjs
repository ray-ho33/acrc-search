#!/usr/bin/env node
/**
 * 권익위 의결례 수집 → Supabase documents UPSERT
 *
 * 사용:
 *   node scripts/ingest-decisions.mjs --max-pages 2
 *   node scripts/ingest-decisions.mjs --max-pages 2 --force
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir, readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { downloadAcrDecisions } from "./lib/acr-download.mjs";
import { mapAcrJsonToDocumentRow } from "./lib/acr-map.mjs";
import { createScriptSupabaseClient } from "./lib/supabase-server.mjs";
import { loadProjectEnv } from "./lib/load-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_CACHE = path.join(REPO_ROOT, ".data", "acr-ingest");

function log(msg) {
  console.log(msg);
}

const { values } = parseArgs({
  options: {
    "max-pages": { type: "string" },
    display: { type: "string" },
    force: { type: "boolean", default: false },
    "cache-dir": { type: "string" },
    "skip-download": { type: "boolean", default: false },
  },
});

const maxPages = values["max-pages"] ? Number(values["max-pages"]) : 2;
const display = values.display ? Number(values.display) : 100;
const cacheDir = values["cache-dir"] || DEFAULT_CACHE;
const force = Boolean(values.force);
const skipDownload = Boolean(values["skip-download"]);

if (!Number.isFinite(maxPages) || maxPages < 1) {
  console.error("--max-pages 는 1 이상의 숫자여야 합니다.");
  process.exit(1);
}

loadProjectEnv();

async function upsertFromCache(textDir) {
  const supabase = createScriptSupabaseClient();
  const names = (await readdir(textDir))
    .filter((f) => f.endsWith(".json"))
    .sort();

  const rows = [];
  let skipped = 0;

  for (const file of names) {
    const externalId = path.basename(file, ".json");
    let data;
    try {
      data = JSON.parse(await readFile(path.join(textDir, file), "utf8"));
    } catch (e) {
      log(`JSON 파싱 실패 ${file}: ${e.message}`);
      skipped++;
      continue;
    }
    const row = mapAcrJsonToDocumentRow(externalId, data);
    if (!row) {
      log(`의결서 없음 — 건너뜀 ${file}`);
      skipped++;
      continue;
    }
    rows.push(row);
  }

  if (rows.length === 0) {
    throw new Error("UPSERT 할 문서가 없습니다. 다운로드·API 키를 확인하세요.");
  }

  const BATCH = 25;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("documents")
      .upsert(chunk, { onConflict: "external_id" });
    if (error) {
      if (/permission denied/i.test(error.message)) {
        throw new Error(
          `Supabase UPSERT 실패: ${error.message}\n\n` +
            "해결 방법:\n" +
            "1) Supabase > Project Settings > API 에서 **service_role** (secret) 키를 SUPABASE_SERVICE_KEY에 넣었는지 확인 (anon 키 X)\n" +
            "2) SQL Editor에서 supabase/migrations/002_grants.sql 실행\n" +
            "3) JSON 캐시가 있으면: npm run ingest -- --max-pages 2 --skip-download",
        );
      }
      throw new Error(`Supabase UPSERT 실패: ${error.message}`);
    }
    upserted += chunk.length;
  }

  const { count, error: countErr } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true });
  if (countErr) {
    log(`경고: documents 건수 조회 실패 — ${countErr.message}`);
  }

  return { upserted, skipped, totalInDb: count ?? null };
}

async function main() {
  log("=== ingest-decisions ===");
  log(`캐시: ${cacheDir}`);

  if (!skipDownload) {
    await downloadAcrDecisions({
      outDir: cacheDir,
      maxPages,
      display,
      force,
      log,
    });
  } else {
    log("--skip-download: 기존 캐시만 DB에 반영합니다.");
  }

  const textDir = path.join(cacheDir, "text");
  const result = await upsertFromCache(textDir);

  log(`UPSERT 완료: ${result.upserted}건 (파일 스킵 ${result.skipped}건)`);
  if (result.totalInDb != null) {
    log(`documents 테이블 전체: ${result.totalInDb}건`);
  }
  log("다음: node scripts/build-embeddings.mjs --limit 50");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

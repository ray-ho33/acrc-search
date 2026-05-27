#!/usr/bin/env node
/**
 * documents → Gemini RETRIEVAL_DOCUMENT 임베딩 → document_embeds UPSERT
 *
 * 사용:
 *   node scripts/build-embeddings.mjs --limit 50
 */

import { parseArgs } from "node:util";
import {
  getGeminiApiKey,
  geminiEmbed,
  l2Normalize,
} from "./lib/gemini-embed.mjs";
import { createScriptSupabaseClient } from "./lib/supabase-server.mjs";
import { loadProjectEnv } from "./lib/load-env.mjs";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIM = 1536;

function log(msg) {
  console.log(msg);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {{ id: string, title: string, summary: string | null, full_text: string | null }} doc
 */
function buildEmbedInput(doc) {
  const parts = [];
  if (doc.title?.trim()) parts.push(doc.title.trim());
  if (doc.summary?.trim()) parts.push(doc.summary.trim());
  if (doc.full_text?.trim()) parts.push(doc.full_text.trim());
  return parts.join("\n\n").trim();
}

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    "batch-size": { type: "string" },
    "delay-ms": { type: "string" },
  },
});

const limit = values.limit ? Number(values.limit) : 50;
const delayMs = values["delay-ms"] ? Number(values["delay-ms"]) : 200;

if (!Number.isFinite(limit) || limit < 1) {
  console.error("--limit 는 1 이상의 숫자여야 합니다.");
  process.exit(1);
}

loadProjectEnv();

async function fetchDocumentsWithoutEmbeds(supabase, lim) {
  const { data: docs, error: docErr } = await supabase
    .from("documents")
    .select("id, title, summary, full_text, external_id")
    .order("created_at", { ascending: true });
  if (docErr) throw new Error(`documents 조회 실패: ${docErr.message}`);

  const { data: embeds, error: embErr } = await supabase
    .from("document_embeds")
    .select("document_id");
  if (embErr) throw new Error(`document_embeds 조회 실패: ${embErr.message}`);

  const embedded = new Set((embeds ?? []).map((e) => e.document_id));
  return (docs ?? []).filter((d) => !embedded.has(d.id)).slice(0, lim);
}

async function main() {
  log("=== build-embeddings ===");
  const supabase = createScriptSupabaseClient();
  const apiKey = getGeminiApiKey();

  const pending = await fetchDocumentsWithoutEmbeds(supabase, limit);
  log(`임베딩 대상: ${pending.length}건 (limit=${limit})`);

  if (pending.length === 0) {
    log("임베딩할 문서가 없습니다. ingest-decisions 를 먼저 실행하세요.");
    return;
  }

  let ok = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < pending.length; i++) {
    const doc = pending[i];
    const text = buildEmbedInput(doc);
    if (!text) {
      log(`텍스트 없음 — 건너뜀 ${doc.external_id}`);
      skipped++;
      continue;
    }

    const title = (doc.title && String(doc.title).trim()) || doc.external_id;
    try {
      const vec = await geminiEmbed(
        text,
        {
          taskType: "RETRIEVAL_DOCUMENT",
          title: title.slice(0, 500),
          outputDimensionality: EMBED_DIM,
        },
        { apiKey, model: EMBED_MODEL },
      );
      const normalized = l2Normalize(vec);

      const { error } = await supabase.from("document_embeds").upsert(
        {
          document_id: doc.id,
          model: EMBED_MODEL,
          dimensions: normalized.length,
          embedding: normalized,
        },
        { onConflict: "document_id" },
      );
      if (error) throw new Error(error.message);

      ok++;
      if ((i + 1) % 10 === 0) {
        log(`… ${i + 1}/${pending.length}건 처리`);
      }
    } catch (e) {
      log(`임베딩 실패 ${doc.external_id}: ${e.message}`);
      errors++;
    }

    if (delayMs > 0) await sleep(delayMs);
  }

  const { count, error: countErr } = await supabase
    .from("document_embeds")
    .select("*", { count: "exact", head: true });
  if (countErr) {
    log(`경고: document_embeds 건수 조회 실패 — ${countErr.message}`);
  } else {
    log(`document_embeds 전체: ${count}건`);
  }

  log(`완료 — 성공 ${ok}, 스킵 ${skipped}, 오류 ${errors}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

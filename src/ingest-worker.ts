/**
 * Ingest a local file into Qdrant using embeddings from Ollama.
 *
 * Steps:
 *  1) Split file into chunks that are friendly for RAG.
 *  2) Embed each chunk with Ollama nomic-embed-text (dim=768 by default).
 *  3) Upsert vectors and payloads into Qdrant with stable ids.
 *
 * Run:
 *   OLLAMA_URL=http://127.0.0.1:11434 \
 *   QDRANT_URL=<your qdrant url> \
 *   QDRANT_API_KEY=<key> \
 *   node -r ts-node/register src/ingest-worker.ts ./src/data/jesse.md
 */

import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { QdrantClient } from "@qdrant/js-client-rest";
import { v5 as uuidv5 } from "uuid";
import { splitMarkdownForRAG, RagChunk } from "./utils/text.js";

const QDRANT_URL = process.env.QDRANT_URL!;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY!;
const COLLECTION = process.env.QDRANT_COLLECTION || "chat_with_me";

const OLLAMA = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const EMBED_MODEL = process.env.EMBED_MODEL || "nomic-embed-text";
const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM || 768);

const qdrant = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY });
const UUID_NS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

async function ensureCollection(): Promise<void> {
  try {
    await qdrant.getCollection(COLLECTION);
  } catch {
    await qdrant.createCollection(COLLECTION, {
      vectors: { size: EMBEDDING_DIM, distance: "Cosine" },
      optimizers_config: { default_segment_number: 2 },
    });
  }
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const P = 6;
  const results: number[][] = new Array(texts.length);
  let idx = 0;

  async function worker() {
    while (idx < texts.length) {
      const i = idx++;
      const r = await fetch(`${OLLAMA}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: EMBED_MODEL, prompt: texts[i] }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`embed failed: ${r.status} ${t}`);
      }
      const j = (await r.json()) as { embedding?: number[] };
      const v = j.embedding;
      if (!Array.isArray(v)) throw new Error("bad embedding shape");
      if (v.length !== EMBEDDING_DIM) {
        throw new Error(`dim mismatch: got ${v.length}, want ${EMBEDDING_DIM}`);
      }
      results[i] = v;
    }
  }

  await Promise.all(Array.from({ length: Math.min(P, texts.length) }, worker));
  return results;
}

async function upsertBatch(
  docId: string,
  chunks: RagChunk[],
  vectors: number[][]
): Promise<void> {
  const now = new Date().toISOString();
  await qdrant.upsert(COLLECTION, {
    wait: true,
    points: chunks.map((chunk, i) => {
      const idSeed = `${docId}:${chunk.section}:${chunk.order}:${sha256(
        chunk.text
      )}`;
      return {
        id: uuidv5(idSeed, UUID_NS),
        vector: vectors[i],
        payload: {
          docId,
          text: chunk.text,
          section: chunk.section,
          question: chunk.question || null,
          order: chunk.order,
          source: docId,
          hash: sha256(chunk.text),
          updatedAt: now,
        },
      };
    }),
  });
}

export async function ingestFile(path: string, docId = path): Promise<void> {
  await ensureCollection();

  const raw = await readFile(path, "utf8");
  const chunks = splitMarkdownForRAG(raw);

  await qdrant.upsert(COLLECTION, {
    wait: true,
    points: [
      {
        id: uuidv5(`docMarker:${docId}`, UUID_NS),
        vector: new Array(EMBEDDING_DIM).fill(0),
        payload: {
          type: "docMarker",
          docId,
          updatedAt: new Date().toISOString(),
        },
      },
    ],
  });

  const B = 48;
  for (let i = 0; i < chunks.length; i += B) {
    const slice = chunks.slice(i, i + B);
    const texts = slice.map((c) => c.text);
    const vectors = await embedBatch(texts);
    await upsertBatch(docId, slice, vectors);
    console.log(`upserted ${Math.min(i + B, chunks.length)}/${chunks.length}`);
  }
  console.log(`ingest complete for ${docId}`);
}

// CLI entry
if (process.argv[1]?.endsWith("src/ingest-worker.ts")) {
  const file = process.argv[2];
  if (!file) {
    console.error(
      "Usage: node -r ts-node/register src/ingest-worker.ts <path-to-file>"
    );
    process.exit(1);
  }
  ingestFile(file).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

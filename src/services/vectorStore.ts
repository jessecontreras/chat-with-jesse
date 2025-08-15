/**
 * Qdrant vector store helpers for search.
 * Works with your existing embed wrapper and envs.
 */

import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";
import { embed } from "./embeddings.js";

let client: QdrantClient | null = null;
let collection = process.env.QDRANT_COLLECTION || "chat_with_me";

export function initVectorStore(url: string, apiKey: string) {
  if (!client) client = new QdrantClient({ url, apiKey });
  collection = process.env.QDRANT_COLLECTION || collection;
}

/**
 * Basic semantic search with payload return.
 * No score threshold. Recall is preferred at this layer.
 */
export async function search(opts: {
  query: string;
  topK: number;
}): Promise<Array<any>> {
  if (!client)
    throw new Error("Qdrant client not initialized. Call initVectorStore()");

  // Support both env styles
  const ollamaUrl =
    process.env.embeddingOllamaUrl ||
    process.env.OLLAMA_URL ||
    "http://127.0.0.1:11434";
  const model =
    process.env.embeddingModel || process.env.EMBED_MODEL || "nomic-embed-text";
  const dim = Number(
    process.env.embeddingDim || process.env.EMBEDDING_DIM || 768
  );
  if (!ollamaUrl || !model || !dim) {
    throw new Error(
      "Embedding configuration missing. Set OLLAMA_URL, EMBED_MODEL, EMBEDDING_DIM"
    );
  }

  const v = await embed(opts.query, { ollamaUrl, model, dim });

  const res = await client.search(collection, {
    vector: v,
    limit: Math.max(1, opts.topK || 8),
    with_payload: true,
    with_vector: false,
  });

  return Array.isArray(res) ? res : [];
}

export async function searchMany(
  queries: string[],
  topK = 4
): Promise<Array<any>> {
  const all: any[] = [];
  const seen = new Set<string>();
  for (const q of queries) {
    const hits = await search({ query: q, topK });
    for (const h of hits) {
      const id = String(h?.id ?? "");
      if (!seen.has(id)) {
        seen.add(id);
        all.push(h);
      }
    }
  }
  return all;
}

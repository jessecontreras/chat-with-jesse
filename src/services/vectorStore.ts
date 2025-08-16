/**
 * @file Qdrant vector store helpers for semantic search.
 * Works with your existing embed wrapper and envs.
 */

import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";
import { embed } from "./embeddings.js";

let client: QdrantClient | null = null;
let collection = process.env.QDRANT_COLLECTION || "chat_with_me";

/**
 * Initialize the Qdrant client used by search helpers.
 *
 * @param url - Base URL of the Qdrant instance.
 * @param apiKey - API key for the Qdrant instance.
 */
export function initVectorStore(url: string, apiKey: string): void {
  if (!client) client = new QdrantClient({ url, apiKey });
  collection = process.env.QDRANT_COLLECTION || collection;
}

/**
 * Basic semantic search with payload return.
 * Recall is preferred over precision at this layer.
 *
 * @param opts - Search parameters.
 * @param opts.query - Text to search for.
 * @param opts.topK - Number of results to return.
 * @returns Array of Qdrant search hits.
 */
export async function search(opts: {
  query: string;
  topK: number;
}): Promise<any[]> {
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

/**
 * Run multiple searches and return a deduplicated list of hits.
 *
 * @param queries - Queries to issue against the vector store.
 * @param topK - Results per query.
 * @returns Combined array of unique search hits.
 */
export async function searchMany(
  queries: string[],
  topK = 4
): Promise<any[]> {
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

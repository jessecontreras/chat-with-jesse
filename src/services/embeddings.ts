/**
 * @file Embedding service.
 * Thin wrapper around Ollama's /api/embeddings endpoint with dimension checks.
 */

/**
 * Generate an embedding vector for the given text using Ollama.
 *
 * @param text - Input text to embed.
 * @param opts - Connection and model options.
 * @param opts.ollamaUrl - Base URL for the Ollama server.
 * @param opts.model - Embedding model identifier (e.g., "nomic-embed-text").
 * @param opts.dim - Expected embedding dimensionality (e.g., 768).
 * @returns Numeric vector representing the text.
 * @throws If the HTTP call fails, or the vector shape/dimension is invalid.
 */
export async function embed(
  text: string,
  opts: { ollamaUrl: string; model: string; dim: number }
): Promise<number[]> {
  const r = await fetch(`${opts.ollamaUrl}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: opts.model, prompt: text }),
  });
  if (!r.ok) throw new Error(`Embeddings HTTP ${r.status}`);

  const j = (await r.json()) as { embedding?: unknown };
  const v = j.embedding;
  if (!Array.isArray(v)) throw new Error("Embedding: bad shape");
  if (v.length !== opts.dim)
    throw new Error(`Embedding dim mismatch ${v.length} != ${opts.dim}`);
  return v as number[];
}

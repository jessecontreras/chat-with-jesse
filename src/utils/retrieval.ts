/**
 * @file Retrieval policy utilities.
 * Adds light rerank using section and question payloads when present.
 */

import { search, searchMany } from "../services/vectorStore";

/**
 * Detect if the user is asking for personal facts.
 *
 * @param message - User message.
 * @returns `true` when the text implies a personal fact request.
 */
function wantsPersonalFacts(message: string): boolean {
  const m = (message || "").toLowerCase();
  return (
    /\b(favo(u)?rite|fav)\b/.test(m) ||
    /\b(where (are you|were you) from|where did you grow up|grew up|born|age)\b/.test(
      m
    ) ||
    /\b(travel|visited|places|country|countries)\b/.test(m)
  );
}

/** Personal nouns we support for favorite facts. */
const PERSONAL_NOUNS = [
  "dog",
  "color",
  "colour",
  "band",
  "music",
  "team",
  "teams",
  "sport",
  "song",
  "food",
  "meal",
];

/**
 * Pull candidate personal keywords from the message.
 *
 * @param message - User message.
 * @returns Array of keywords appearing in the message.
 */
function derivePersonalKeywords(message: string): string[] {
  const m = (message || "").toLowerCase();
  return PERSONAL_NOUNS.filter((n) => m.includes(n));
}

/**
 * Default filter to drop personal trivia for technical questions.
 *
 * @param line - Text line from a document.
 * @returns `true` if the line is considered personal noise.
 */
function isPersonalNoiseLine(line: string): boolean {
  return (
    /\bFavorite\s+(band|dog|music|color|teams?)\b/i.test(line) ||
    /\bHas visited:\b/i.test(line) ||
    /\bPersonal Interests\b/i.test(line)
  );
}

/**
 * Extract lines that appear to contain specific favorite facts.
 *
 * @param text - Text blob to scan.
 * @param keywords - Candidate personal keywords.
 * @returns Array of lines mentioning favorites.
 */
function extractFavoriteLines(text: string, keywords: string[]): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const favRe = /\bfavo(u)?rite\b/i;

  const hits = lines.filter((l) => {
    if (!favRe.test(l)) return false;
    const L = l.toLowerCase();
    return keywords.length === 0 || keywords.some((k) => L.includes(k));
  });

  return hits;
}

/**
 * Deduplicate values while preserving their original order.
 *
 * @param arr - Array of values.
 * @returns Array with duplicates removed.
 */
function uniq<T>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    const k = String(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}

/**
 * Build a context block by retrieving topK snippets for the user message.
 * Light rerank boosts exact matches on payload.question and section intent.
 *
 * @param message - User message to ground against.
 * @param topK - Number of snippets to retrieve.
 * @returns Combined context string.
 */
export async function buildContext(
  message: string,
  topK: number
): Promise<string> {
  if (topK <= 0) return "";

  const personal = wantsPersonalFacts(message);
  const keywords = derivePersonalKeywords(message);

  const primaryHits = await search({ query: message, topK });
  let extraHits: any[] = [];
  const hits = primaryHits
    .map((h: any) => ({
      text: String(h?.payload?.text || ""),
      section: String(h?.payload?.section || ""),
      question: String(h?.payload?.question || ""),
    }))
    .filter((h) => h.text);

  // light rerank
  const q = (message || "").toLowerCase();
  const scored = hits
    .map((h) => {
      let score = 0;
      if (h.question) {
        const shortQ = h.question.toLowerCase().slice(0, 48);
        if (shortQ && q.includes(shortQ)) score += 2;
      }
      if (
        /how|when|describe|what/i.test(message) &&
        /Recruiter Q&A/i.test(h.section)
      ) {
        score += 1;
      }
      return { ...h, score };
    })
    .sort((a, b) => b.score - a.score);

  const texts = scored.map((h) => h.text);

  // favorites special case
  let favored = uniq(texts.flatMap((t) => extractFavoriteLines(t, keywords)));
  if (personal && favored.length === 0) {
    const synQueries: string[] = [];
    if (keywords.length) {
      for (const k of keywords) {
        synQueries.push(`favorite ${k}`, `${k} favorite`, `favourite ${k}`);
      }
    } else {
      synQueries.push("favorite", "favourite");
    }
    extraHits = await searchMany(
      synQueries,
      Math.max(2, Math.floor(topK / 2))
    );
    const moreTexts = extraHits
      .map((h: any) => String(h?.payload?.text || ""))
      .filter(Boolean);
    favored = uniq(moreTexts.flatMap((t) => extractFavoriteLines(t, keywords)));
  }

  const allHits = primaryHits.concat(extraHits);
  if (allHits.length === 0) {
    const collection = process.env.QDRANT_COLLECTION || "chat_with_me";
    console.warn(
      `Vector search returned no hits for "${message}" in collection "${collection}"`
    );
  }

  if (personal && favored.length > 0) {
    return favored.slice(0, 4).join("\n");
  }

  const trimmed = texts
    .filter((t) => (personal ? true : !isPersonalNoiseLine(t)))
    .map((t) => t.slice(0, 800));

  return trimmed.join("\n\n");
}

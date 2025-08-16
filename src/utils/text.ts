/**
 * @file Utilities for splitting markdown into RAG-friendly chunks.
 * Each Q with its A is one chunk.
 * Each H2 or H3 defines a section anchor.
 * Long sections are soft wrapped with overlap.
 */

export type RagChunk = {
  text: string;
  section: string;
  question?: string;
  order: number;
};

const MAX_CHARS = 3500; // about 900 tokens
const OVERLAP = 200;

/**
 * Trim trailing whitespace from lines and collapse blank lines.
 *
 * @param s - String to clean.
 * @returns Cleaned string.
 */
function clean(s: string): string {
  return s.replace(/[ \t]+\n/g, "\n").trim();
}

/**
 * Split a markdown document into overlapping RAG chunks.
 *
 * @param md - Markdown source text.
 * @returns Array of chunk objects with section metadata.
 */
export function splitMarkdownForRAG(md: string): RagChunk[] {
  const lines = md.split("\n");
  const out: RagChunk[] = [];

  let section = "Intro";
  let buf: string[] = [];
  let order = 0;
  let currentQuestion: string | undefined;

  const flush = () => {
    if (buf.length === 0) return;
    const text = clean(buf.join("\n"));
    let i = 0;
    while (i < text.length) {
      const slice = text.slice(i, i + MAX_CHARS);
      out.push({
        text: slice,
        section,
        question: currentQuestion,
        order: order++,
      });
      i += Math.max(slice.length - OVERLAP, slice.length);
    }
    buf = [];
  };

  for (const ln of lines) {
    const h2 = ln.match(/^##\s+(.+)/);
    const h3 = ln.match(/^###\s+(.+)/);
    if (h2 || h3) {
      flush();
      currentQuestion = undefined;
      section = clean((h2?.[1] || h3?.[1]) ?? section);
      continue;
    }
    const q = ln.match(/^\*\*Q:\s*(.+?)\*\*/i);
    if (q) {
      flush();
      currentQuestion = clean(q[1]);
      buf = [ln];
      continue;
    }
    buf.push(ln);
  }
  flush();

  return out.filter((c) => c.text.replace(/\W/g, "").length > 0);
}

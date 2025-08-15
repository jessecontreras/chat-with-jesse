/**
 * @file Intro answer chain (LangChain Core + plain Zod).
 * Produces a concise, label-free intro reply with one short follow-up.
 *
 * Used ONLY for "profile_basic" intent. Other intents still use chatStream().
 */

import "dotenv/config";
import { z } from "zod";
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { LlmCaps } from "../services/llm.js";

const OLLAMA = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const CHAT_MODEL = process.env.CHAT_MODEL || "mistral:7b-instruct-q4_K_M";

/** Remove dataset-y labels or bullets the model might echo. */
function sanitize(s: string): string {
  return s
    .replace(
      /^\s*\*{0,2}\s*(Prompt|Question|Target|Answer|Q|A|Follow[-\s]?up)\s*\*{0,2}\s*[:：]\s*/gim,
      ""
    )
    .replace(/^\s*[-•]\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cap to N sentences. */
function firstNSentences(s: string, n: number): string {
  const parts = s.replace(/\s+/g, " ").split(/(?<=[.!?])\s/);
  return parts.slice(0, n).join(" ").trim();
}

/** Extract first JSON object from a string (tolerates extra prose). */
function extractFirstJson(text: string): any | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

/** Get plain text from an AIMessage-ish result. */
function toText(res: any): string {
  const c = res?.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    return c
      .map((p: any) =>
        typeof p === "string" ? p : p?.text ?? p?.content ?? p?.data?.text ?? ""
      )
      .join("");
  }
  return String(c ?? "");
}

/**
 * Generate a short, personable intro response with one follow-up question.
 *
 * @param userMessage The visitor's message (intro/hiring style).
 * @param systemPolicy Your base system content (values, boundaries, etc).
 * @param caps Length/temperature caps; numPredict is derived from max_tokens.
 */
export async function generateIntroAnswer(
  userMessage: string,
  systemPolicy: string,
  caps: LlmCaps
): Promise<string> {
  // Plain Zod schema for validation after JSON parse
  const Schema = z.object({
    answer: z
      .string()
      .max(600)
      .describe(
        "Warm, professional reply in plain text, 2–3 sentences, no lists, no labels like 'Prompt:' or 'Target:'."
      ),
    follow_up: z
      .string()
      .max(200)
      .describe("One short follow-up question that invites the next step."),
  });

  // Put ANY brace-heavy strings into variables so the template parser never sees raw { }.
  const schemaExample = `{"answer":"...","follow_up":"..."}`;

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      [
        "{policy}",
        "",
        "You are crafting a concise INTRO answer. Constraints:",
        "- 2–3 sentences total.",
        "- No lists, no markdown headers, no dataset labels such as 'Prompt:', 'Target:', 'Q:', 'A:', or 'Follow-up:'.",
        "- Friendly and professional; keep it conversational and first-person.",
        "",
        "Return ONLY a minified JSON object exactly like this:",
        "{schema}",
        "Do not add markdown fences or any extra text.",
      ].join("\n"),
    ],
    [
      "human",
      ["User: {user}", "", "Write the answer in Jesse's voice."].join("\n"),
    ],
  ]);

  const model = new ChatOllama({
    baseUrl: OLLAMA,
    model: CHAT_MODEL,
    temperature: caps?.temperature ?? 0.3,
    numPredict: Math.max(1, Math.floor(caps?.max_tokens ?? 128)),
  });

  // Run the chain (prompt → model)
  const aiMsg = await prompt.pipe(model).invoke({
    user: userMessage,
    policy: systemPolicy,
    schema: schemaExample,
  });

  // Parse + validate JSON
  const raw = toText(aiMsg);
  const json = extractFirstJson(raw);

  if (json) {
    const parsed = Schema.safeParse(json);
    if (parsed.success) {
      const answer = firstNSentences(sanitize(parsed.data.answer || ""), 3);
      const follow = sanitize(parsed.data.follow_up || "");
      return follow ? `${answer} ${follow}` : answer;
    }
  }

  // Fallback: sanitize & clamp whatever came back
  const fallback = firstNSentences(sanitize(raw), 3);
  return fallback || "I don’t know.";
}

/**
 * @file GraphQL schema and resolvers.
 * Hybrid routing (rules → tiny LLM JSON fallback), intent-based retrieval,
 * structured output for intro answers, output sanitization elsewhere,
 * and short-answer clamps where appropriate.
 */

import Fastify from "fastify";
import mercurius from "mercurius";
import { readFile } from "node:fs/promises";
import { initVectorStore } from "../services/vectorStore";
import { buildContext } from "../utils/retrieval";
import { routeIntent, intentParams, styleInstruction } from "../utils/intent";
import { shouldRetrieve, isShortIntent } from "../router/hybrid";
import { chatStream } from "../services/llm";
import { generateIntroAnswer } from "../chains/introAnswer";

/** Minimal schema for a chat-first API. */
const schema = /* GraphQL */ `
  type Query {
    ping: String
  }
  type Mutation {
    chat(message: String!): String!
  }
`;

let __SYSTEM_CACHE__: string | null = null;

/**
 * Load system content and append answer policies if present.
 *
 * @returns Combined system prompt string.
 */
async function getSystemContent(): Promise<string> {
  if (__SYSTEM_CACHE__) return __SYSTEM_CACHE__;

  let base = "";
  try {
    base = (await readFile("./src/prompts/systemPrompt.md", "utf8")).trim();
  } catch {
    try {
      const raw = await readFile("./data/system-content.json", "utf8");
      const json = JSON.parse(raw);
      base = String(json?.systemContent || "").trim();
    } catch {
      base =
        "You are a helpful assistant. If the answer is not in the provided context, reply with I don’t know.";
    }
  }

  let policies = "";
  try {
    policies = (
      await readFile("./src/prompts/answerPolicies.md", "utf8")
    ).trim();
  } catch {
    // optional
  }

  const APPEND_POLICIES =
    (process.env.APPEND_POLICIES || "true").toLowerCase() === "true";

  __SYSTEM_CACHE__ =
    policies && APPEND_POLICIES ? `${base}\n\n---\n\n${policies}` : base;

  return __SYSTEM_CACHE__;
}

/**
 * Remove dataset labels the model may echo (Prompt/Target/Q/A/Follow-up).
 *
 * @param s - Raw model output.
 * @returns Sanitized output string.
 */
function sanitizeOutput(s: string): string {
  return s
    .replace(
      /^\s*\*{0,2}\s*(Prompt|Question|Target|Answer|Q|A|Follow[-\s]?up)\s*\*{0,2}\s*[:：]\s*/gim,
      ""
    )
    .replace(/^\s*[-•]\s*/gm, "")
    .trim();
}

/**
 * Return the first N sentences from a blob of text.
 *
 * @param s - Input text.
 * @param n - Maximum number of sentences.
 * @returns Truncated text containing at most N sentences.
 */
function firstNSentences(s: string, n: number): string {
  const parts = s.replace(/\s+/g, " ").split(/(?<=[.!?])\s/);
  return parts.slice(0, n).join(" ");
}

/**
 * Create and configure the Fastify GraphQL application.
 *
 * @returns Configured Fastify instance.
 */
export async function createApp() {
  const app = Fastify({ logger: false });
  initVectorStore(process.env.QDRANT_URL!, process.env.QDRANT_API_KEY!);

  const resolvers = {
    Query: { ping: () => "pong" },
    Mutation: {
      chat: async (_: unknown, { message }: { message: string }) => {
        // 1) Route
        const intent = await routeIntent(message);
        const { llm, topK } = intentParams(intent);

        // 2) Retrieval (router-gated)
        const ctx = shouldRetrieve(intent)
          ? await buildContext(message, topK)
          : "";

        // 3) System prompt with per-intent style
        let sys = await getSystemContent();
        sys += `\n\nPolicy: ${styleInstruction(intent)}`;
        if (!ctx && (intent === "profile_specific" || intent === "deep_tech")) {
          sys += `\n\nCRITICAL: If the answer is not in the provided context, reply strictly with: I don’t know.`;
        }

        // 4) Intro answers use the structured chain
        if (intent === "profile_basic") {
          return await generateIntroAnswer(message, sys, llm);
        }

        // 5) Messages for other intents
        const messages = [
          { role: "system", content: sys },
          {
            role: "user",
            content: ctx
              ? `Use only the context to answer. If it is not in the context, say I don’t know.\n\nContext:\n${ctx}\n\nQuestion:\n${message}`
              : message,
          },
        ] as const;

        // 6) Model call
        const raw = await chatStream(messages as any, llm);

        // 7) Sanitize and clamp if it's a short intent (e.g., small talk)
        const stripped = sanitizeOutput(raw);
        const finalText = isShortIntent(intent)
          ? firstNSentences(stripped, 3)
          : stripped;

        return finalText || "I don’t know.";
      },
    },
  };

  const enableGraphiQL =
    (process.env.NODE_ENV || "development").toLowerCase() !== "production";
  app.register(mercurius, { schema, resolvers, graphiql: enableGraphiQL });
  return app;
}

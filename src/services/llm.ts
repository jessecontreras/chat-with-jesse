/**
 * @file LLM service wrapper using LangChain (Core + Ollama).
 * Keeps the same public API you already use: `chatStream(messages, caps)`.
 *
 * - No LangChain Community deps.
 * - Respects temperature and max_tokens (mapped to Ollama's numPredict).
 * - Accepts your existing OpenAI-style message array.
 */

import "dotenv/config";
import { ChatOllama } from "@langchain/ollama";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  BaseMessage,
} from "@langchain/core/messages";

/** Caps your resolvers pass to control reply length and style. */
export type LlmCaps = {
  max_tokens: number;
  temperature: number;
};

const OLLAMA = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const CHAT_MODEL = process.env.CHAT_MODEL || "mistral:7b-instruct-q4_K_M";

/**
 * Convert OpenAI-style messages into LangChain message objects.
 *
 * @param messages - Array of OpenAI-format messages.
 * @returns Array of LangChain message instances.
 */
function toLcMessages(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): BaseMessage[] {
  return messages.map((m) => {
    switch (m.role) {
      case "system":
        return new SystemMessage(m.content);
      case "assistant":
        return new AIMessage(m.content);
      default:
        return new HumanMessage(m.content);
    }
  });
}

/**
 * Extract plain text from a LangChain AIMessage result.
 *
 * @param res - LangChain AIMessage or compatible object.
 * @returns Trimmed text content.
 */
function toText(res: { content: unknown }): string {
  const c = (res as any).content;
  if (typeof c === "string") return c.trim();
  if (Array.isArray(c)) {
    // MessageContent array → join text parts
    return c
      .map((p: any) =>
        typeof p === "string" ? p : p?.text ?? p?.content ?? p?.data?.text ?? ""
      )
      .join("")
      .trim();
  }
  return String(c ?? "").trim();
}

/**
 * Chat via LangChain + Ollama and return the whole reply as a string.
 *
 * @param messages - OpenAI-style messages (system/user/assistant).
 * @param caps - Controls temperature and length.
 * @returns Generated assistant reply.
 */
export async function chatStream(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  caps: LlmCaps
): Promise<string> {
  const model = new ChatOllama({
    baseUrl: OLLAMA,
    model: CHAT_MODEL,
    temperature: caps?.temperature ?? 0.3,
    // Ollama's length control is `numPredict`
    numPredict: Math.max(1, Math.floor(caps?.max_tokens ?? 256)),
    // keepAlive: "5m", // optional
  });

  const result = await model.invoke(toLcMessages(messages));
  return toText(result);
}

/**
 * @file Intent routing utilities.
 * Routes a user message into coarse intents that control retrieval and style.
 */

export type Intent =
  | "small_talk" // pleasantries / greetings / generic banter
  | "profile_basic" // "who are you" / "what do you do"
  | "profile_specific" // concrete facts about Jesse (favorites, bio facts)
  | "deep_tech" // technical how/why questions
  | "hiring"; // recruiting / availability / rates

/**
 * Normalize input once for intent routing.
 *
 * @param s - String to normalize.
 * @returns Lowercased and trimmed string.
 */
function norm(s: string): string {
  return (s || "").toLowerCase().trim();
}

/**
 * Route a user message into a coarse intent.
 * Keep heuristics fast and readable.
 *
 * @param message - Raw user message.
 * @returns Predicted intent label.
 */
export function routeIntent(message: string): Intent {
  const m = norm(message);

  // Hiring / recruiting
  if (
    /\b(hire|hiring|recruit|recruiter|open role|opening|join our|availability|available|contract|rates?)\b/.test(
      m
    )
  ) {
    return "hiring";
  }

  // Profile-specific: concrete facts (favorites, places, bio facts)
  if (
    /\b(favo(u)?rite|fav)\b/.test(m) ||
    /\b(dog|color|colour|band|music|team|sport|song|food|meal)\b/.test(m) ||
    /\b(where (are you|were you) from|where did you grow up|grew up|born|age)\b/.test(
      m
    ) ||
    /\b(travel|visited|places|country|countries)\b/.test(m)
  ) {
    return "profile_specific";
  }

  // Profile-basic: “who are you / what do you do?”
  if (
    /\b(who are you|what do you do|introduce|about yourself|tell me about you)\b/.test(
      m
    )
  ) {
    return "profile_basic";
  }

  // Deep-tech: stack, infra, RAG, containers, etc.
  if (
    /\b(graphql|postgres|postgresql|sql|react|angular|svelte|node|nestjs|docker|kubernetes|k8s|ingress|nginx|qdrant|upstash|rag|embedding|vector|ollama|mistral|ci\/cd|github actions|aws|digitalocean)\b/.test(
      m
    )
  ) {
    return "deep_tech";
  }

  // Default to small talk
  return "small_talk";
}

/**
 * Per-intent LLM and retrieval caps used by resolvers.
 *
 * @param intent - Intent label from {@link routeIntent}.
 * @returns Object with LLM caps and retrieval depth.
 */
export function intentParams(intent: Intent): {
  llm: { max_tokens: number; temperature: number };
  topK: number;
} {
  switch (intent) {
    case "profile_basic":
      return { llm: { max_tokens: 160, temperature: 0.3 }, topK: 0 };
    case "profile_specific":
      // ensure retrieval for facts
      return { llm: { max_tokens: 200, temperature: 0.3 }, topK: 8 };
    case "deep_tech":
      return { llm: { max_tokens: 600, temperature: 0.2 }, topK: 10 };
    case "hiring":
      return { llm: { max_tokens: 220, temperature: 0.3 }, topK: 4 };
    default: // small_talk
      return { llm: { max_tokens: 120, temperature: 0.4 }, topK: 0 };
  }
}

/**
 * Per-intent tone and constraints appended in the system prompt.
 *
 * @param intent - Intent label from {@link routeIntent}.
 * @returns Style guidance string.
 */
export function styleInstruction(intent: Intent): string {
  switch (intent) {
    case "profile_basic":
      return "Keep it to 2–3 sentences, warm and professional, first-person, no markdown lists.";
    case "profile_specific":
      return [
        "Answer crisply and factually from the provided context.",
        "If the question asks for a single favorite (dog, color, band, etc.), reply with one short sentence that states ONLY that fact (e.g., 'Black and Tan Shiba.').",
        "Do not list unrelated favorites. If the fact is missing, respond exactly with I don’t know.",
      ].join(" ");
    case "deep_tech":
      return "Answer step-by-step with precise, implementation-level details when available. If unknown, respond exactly with I don’t know.";
    case "hiring":
      return "Be friendly and concise. Offer next steps (share portfolio, scheduling) without disclosing private contact details.";
    default: // small_talk
      return "Be concise and personable. Prefer one or two sentences.";
  }
}

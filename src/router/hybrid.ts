/**
 * @file Simple helpers the resolver uses to decide retrieval & clamping.
 */

import type { Intent } from "../utils/intent";

/**
 * Determine whether semantic retrieval should occur for a given intent.
 *
 * @param intent - Intent predicted for the user's message.
 * @returns `true` if retrieval should be performed.
 */
export function shouldRetrieve(intent: Intent): boolean {
  return (
    intent === "profile_specific" ||
    intent === "deep_tech" ||
    intent === "hiring"
  );
}

/**
 * Check if a response for the intent should be clamped to a short answer.
 *
 * @param intent - Intent predicted for the user's message.
 * @returns `true` for short-answer intents.
 */
export function isShortIntent(intent: Intent): boolean {
  return intent === "small_talk" || intent === "profile_basic";
}

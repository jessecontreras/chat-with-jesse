/**
 * @file Simple helpers the resolver uses to decide retrieval & clamping.
 */

import type { Intent } from "../utils/intent";

/** Retrieval on/off per intent. */
export function shouldRetrieve(intent: Intent): boolean {
  return (
    intent === "profile_specific" ||
    intent === "deep_tech" ||
    intent === "hiring"
  );
}

/** Short-answer clamp per intent. */
export function isShortIntent(intent: Intent): boolean {
  return intent === "small_talk" || intent === "profile_basic";
}

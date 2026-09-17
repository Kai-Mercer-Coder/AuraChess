/**
 * Coach — rule-based coaching messages for the review.
 *
 * `getCoachMessage` returns a single short tip for the position just played,
 * derived by walking declarative `RULES` (see rules.ts) whose conditions are
 * named booleans defined in conditions.ts. Text is picked stably per game.
 */
export type { CoachMessage, CoachTone, CoachRule, CoachContext } from "./types";
export { getCoachMessage } from "./engine";
export { RULES } from "./rules";
export { CONDITIONS } from "./conditions";
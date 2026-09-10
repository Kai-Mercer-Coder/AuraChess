/**
 * Undefended heatmap: no geometry here — it reuses the Rust analyzer's
 * hanging pieces, rendered as a ring by the board. This module just tags
 * each hanging piece with its side for display.
 */
import type { HangingRef } from "@/lib/chess/engine-rs/types";

export interface TaggedHanging extends HangingRef {
  side: "W" | "B";
}

export function tagHanging(
  white: HangingRef[],
  black: HangingRef[],
): TaggedHanging[] {
  return [
    ...white.map((h) => ({ ...h, side: "W" as const })),
    ...black.map((h) => ({ ...h, side: "B" as const })),
  ];
}

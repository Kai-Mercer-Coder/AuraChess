/**
 * Generic white/black square lists → square → background-color map for the
 * board renderer. Shared by every tint-based heatmap kind: `all` colors
 * each side's zone with overlap as contested purple.
 */
import { HEATMAP_COLORS } from "./types";

export function buildZoneOverlay(
  white: string[],
  black: string[],
  mode: "all" | "white" | "black",
): Record<string, string> {
  const out: Record<string, string> = {};
  const blackSet = new Set(black);
  const whiteSet = new Set(white);

  if (mode === "white" || mode === "all") {
    for (const sq of white) {
      out[sq] =
        mode === "all" && blackSet.has(sq)
          ? HEATMAP_COLORS.contested
          : HEATMAP_COLORS.white;
    }
  }
  if (mode === "black" || mode === "all") {
    for (const sq of black) {
      if (mode === "all" && whiteSet.has(sq)) {
        out[sq] = HEATMAP_COLORS.contested;
      } else if (!(sq in out)) {
        out[sq] = HEATMAP_COLORS.black;
      }
    }
  }
  return out;
}

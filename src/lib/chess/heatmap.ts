/**
 * Board heatmap computation.
 *
 * For the displayed position, collects every square the side to move can
 * travel to ("ours") and every square the opponent can travel to ("theirs",
 * via a turn-swapped FEN so chess.js generates their legal moves). Squares in
 * both sets are "contested". Basic v1: reachability only, no pin/attack
 * refinement.
 */
import { Chess } from "chess.js";

export type HeatmapMode = "all" | "ours" | "theirs";

export interface HeatmapData {
  ours: string[];
  theirs: string[];
  contested: string[];
  side: "white" | "black";
}

/** Fill colors per zone (tints, so pieces stay readable underneath). */
export const HEATMAP_COLORS = {
  ours: "rgba(52, 211, 153, 0.28)",
  theirs: "rgba(239, 68, 68, 0.30)",
  contested: "rgba(168, 85, 247, 0.34)",
} as const;

export function computeHeatmap(fen: string): HeatmapData {
  const game = new Chess(fen);
  const side = game.turn() === "w" ? "white" : "black";
  const ours = new Set(game.moves({ verbose: true }).map((m) => m.to));

  // Opponent reachability: same position with the turn flipped.
  const theirs = new Set<string>();
  try {
    const parts = fen.split(" ");
    parts[1] = parts[1] === "w" ? "b" : "w";
    const opp = new Chess(parts.join(" "));
    for (const m of opp.moves({ verbose: true })) theirs.add(m.to);
  } catch {
    // Flipped FEN unusable (shouldn't happen) — theirs stays empty.
  }

  const contested = [...ours].filter((sq) => theirs.has(sq));
  return { ours: [...ours], theirs: [...theirs], contested, side };
}

/**
 * Reduce heatmap data + mode to a square → background-color map for the
 * board renderer. `all`: ours-only emerald, theirs-only red, contested
 * purple. `ours`/`theirs`: single-zone view of that side's reach.
 */
export function buildHeatmapOverlay(
  data: HeatmapData,
  mode: HeatmapMode,
): Record<string, string> {
  const out: Record<string, string> = {};
  const theirsSet = new Set(data.theirs);
  const oursSet = new Set(data.ours);

  if (mode === "ours" || mode === "all") {
    for (const sq of data.ours) {
      out[sq] =
        mode === "all" && theirsSet.has(sq)
          ? HEATMAP_COLORS.contested
          : HEATMAP_COLORS.ours;
    }
  }
  if (mode === "theirs" || mode === "all") {
    for (const sq of data.theirs) {
      if (mode === "all" && oursSet.has(sq)) {
        out[sq] = HEATMAP_COLORS.contested;
      } else if (!(sq in out)) {
        out[sq] = HEATMAP_COLORS.theirs;
      }
    }
  }
  return out;
}

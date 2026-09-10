/**
 * Board heatmap computation.
 *
 * Fixed White perspective (no side flipping while navigating): `white` is
 * every square White attacks, `black` every square Black attacks, `contested`
 * the intersection. Own-occupied squares are excluded — pieces can't travel
 * onto them, so they aren't "in reach". Basic v1: raw attack patterns, no
 * pin refinement.
 */
import { Chess, type Square } from "chess.js";

export type HeatmapMode = "all" | "white" | "black";

export interface HeatmapData {
  white: string[];
  black: string[];
  contested: string[];
  turn: "white" | "black";
}

/** Fill colors per zone (tints, so pieces stay readable underneath). */
export const HEATMAP_COLORS = {
  white: "rgba(52, 211, 153, 0.28)",
  black: "rgba(239, 68, 68, 0.30)",
  contested: "rgba(168, 85, 247, 0.34)",
} as const;

const FILES = "abcdefgh";
const ALL_SQUARES: string[] = [];
for (let rank = 1; rank <= 8; rank++) {
  for (const file of FILES) ALL_SQUARES.push(`${file}${rank}`);
}

/** Squares attacked by `by`, skipping squares occupied by their own pieces. */
function attackedSquares(game: Chess, by: "w" | "b"): Set<string> {
  const out = new Set<string>();
  const board = game.board();
  for (const sq of ALL_SQUARES) {
    if (game.attackers(sq as Square, by).length === 0) continue;
    // game.board() is ordered rank 8 → 1.
    const occupant = board[8 - parseInt(sq[1], 10)][FILES.indexOf(sq[0])];
    if (occupant && occupant.color === by) continue;
    out.add(sq);
  }
  return out;
}

export function computeHeatmap(fen: string): HeatmapData {
  const game = new Chess(fen);
  const turn = game.turn() === "w" ? "white" : "black";
  const white = attackedSquares(game, "w");
  const black = attackedSquares(game, "b");
  const contested = [...white].filter((sq) => black.has(sq));
  return { white: [...white], black: [...black], contested, turn };
}

/**
 * Reduce heatmap data + mode to a square → background-color map for the
 * board renderer. `all`: white-only emerald, black-only red, contested
 * purple. `white`/`black`: single-zone view of that side's reach.
 */
export function buildHeatmapOverlay(
  data: HeatmapData,
  mode: HeatmapMode,
): Record<string, string> {
  const out: Record<string, string> = {};
  const blackSet = new Set(data.black);
  const whiteSet = new Set(data.white);

  if (mode === "white" || mode === "all") {
    for (const sq of data.white) {
      out[sq] =
        mode === "all" && blackSet.has(sq)
          ? HEATMAP_COLORS.contested
          : HEATMAP_COLORS.white;
    }
  }
  if (mode === "black" || mode === "all") {
    for (const sq of data.black) {
      if (mode === "all" && whiteSet.has(sq)) {
        out[sq] = HEATMAP_COLORS.contested;
      } else if (!(sq in out)) {
        out[sq] = HEATMAP_COLORS.black;
      }
    }
  }
  return out;
}

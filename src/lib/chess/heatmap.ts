/**
 * Board heatmap computation.
 *
 * Organized by heatmap kind so new visualizations slot in (Space,
 * Undefended, King space today; more later):
 * - Space: fixed White perspective, no side flipping while navigating.
 *   `white` = squares White attacks, `black` = squares Black attacks,
 *   `contested` = the intersection. Own-occupied squares are excluded.
 * - Undefended: no geometry here — it reuses the Rust analyzer's hanging
 *   pieces, rendered as a ring by the board.
 * - King space: safe neighboring squares for each king (no enemy attacks).
 *   `theoretical` includes own-occupied squares (e.g. the pawn shield);
 *   `strict` keeps only squares the king could actually move to.
 * Basic v1: raw attack patterns, no pin refinement.
 */
import { Chess, type Square } from "chess.js";

export type HeatmapKind = "space" | "undefended" | "king";
export type SpaceMode = "all" | "white" | "black";
export type KingMode = "theoretical" | "strict";

export interface SpaceHeatmap {
  white: string[];
  black: string[];
  contested: string[];
  turn: "white" | "black";
}

export interface KingHeatmap {
  white: string[];
  black: string[];
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

export function computeSpaceHeatmap(fen: string): SpaceHeatmap {
  const game = new Chess(fen);
  const turn = game.turn() === "w" ? "white" : "black";
  const white = attackedSquares(game, "w");
  const black = attackedSquares(game, "b");
  const contested = [...white].filter((sq) => black.has(sq));
  return { white: [...white], black: [...black], contested, turn };
}

/** Neighboring squares of `color`'s king with no enemy attacks on them. */
function kingSafeSquares(game: Chess, color: "w" | "b", mode: KingMode): string[] {
  const enemy = color === "w" ? "b" : "w";
  const board = game.board();

  let kingSq: string | null = null;
  for (let r = 0; r < 8 && !kingSq; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (piece && piece.type === "k" && piece.color === color) {
        kingSq = `${FILES[f]}${8 - r}`;
      }
    }
  }
  if (!kingSq) return [];

  const kf = FILES.indexOf(kingSq[0]);
  const kr = parseInt(kingSq[1], 10);
  const out: string[] = [];
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const f = kf + df;
      const r = kr + dr;
      if (f < 0 || f > 7 || r < 1 || r > 8) continue;
      const sq = `${FILES[f]}${r}`;
      if (game.attackers(sq as Square, enemy).length > 0) continue;
      if (mode === "strict") {
        const occupant = board[8 - r][f];
        if (occupant && occupant.color === color) continue;
      }
      out.push(sq);
    }
  }
  return out;
}

export function computeKingHeatmap(fen: string, mode: KingMode): KingHeatmap {
  const game = new Chess(fen);
  const turn = game.turn() === "w" ? "white" : "black";
  return {
    white: kingSafeSquares(game, "w", mode),
    black: kingSafeSquares(game, "b", mode),
    turn,
  };
}

/**
 * Reduce two white/black square lists + a zone mode to a square →
 * background-color map for the board renderer. Shared by the Space and King
 * kinds: `all` colors each side's zone with overlap as contested purple.
 */
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

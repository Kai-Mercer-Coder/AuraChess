/**
 * Space heatmap: fixed White perspective, no side flipping while navigating.
 * `white` = squares White attacks, `black` = squares Black attacks,
 * `contested` = the intersection. Own-occupied squares are excluded.
 * Basic v1: raw attack patterns, no pin refinement.
 */
import { Chess, type Square } from "chess.js";
import { FILES, ALL_SQUARES } from "./squares";
import type { SpaceHeatmap } from "./types";

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

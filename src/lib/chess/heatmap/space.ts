/**
 * Space heatmap: fixed White perspective, no side flipping while navigating.
 * `white` = squares White attacks, `black` = squares Black attacks,
 * `contested` = the intersection. Occupied squares are included — pieces
 * sitting on controlled squares get highlighted too.
 * Basic v1: raw attack patterns, no pin refinement.
 */
import { Chess, type Square } from "chess.js";
import { ALL_SQUARES } from "./squares";
import type { SpaceHeatmap } from "./types";

/** Every square attacked by `by`, including occupied ones. */
function attackedSquares(game: Chess, by: "w" | "b"): Set<string> {
  const out = new Set<string>();
  for (const sq of ALL_SQUARES) {
    if (game.attackers(sq as Square, by).length === 0) continue;
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

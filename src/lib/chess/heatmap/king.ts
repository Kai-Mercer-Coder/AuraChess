/**
 * King space heatmap: safe neighboring squares for each king (no enemy
 * attacks on them). `theoretical` includes own-occupied squares (e.g. the
 * pawn shield); `strict` keeps only squares the king could actually move to.
 * Basic v1: raw attack patterns, no pin refinement.
 */
import { Chess, type Square } from "chess.js";
import { FILES } from "./squares";
import type { KingHeatmap, KingMode } from "./types";

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

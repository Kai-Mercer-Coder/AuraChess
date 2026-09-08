/**
 * Move classification scoring.
 *
 * Given two successive engine evaluations (before/after a move) we derive a
 * "Win Probability Lost" (WPL) amount and bucket it into human-facing labels
 * (brilliant, best, inaccuracy, blunder, ...). Every classification also maps
 * to a 0..1 quality score used to compute per-side accuracy percentages.
 */
import { Classification } from "../types/Classification";

export { Classification };

/** Quality score (0..1) attributed to each classification, used for accuracy. */
export const classificationValues = {
  blunder: 0,
  mistake: 0.2,
  inaccuracy: 0.4,
  good: 0.65,
  excellent: 0.9,
  best: 1,
  great: 1,
  brilliant: 1,
  book: 1,
  forced: 1,
  miss: 0,
  critical: 0.4,
  theory: 1,
  risky: 0.4,
};

export const WPL_THRESHOLDS = {
  best: 0.01,
  excellent: 0.035,
  good: 0.07,
  inaccuracy: 0.1,
  mistake: 0.2,
  blunder: 1,
};

/** Standard sigmoid mapping of a centipawn eval to a win probability in [0,1]. */
function sigmoidWinPercent(cpValue: number): number {
  return 1 / (1 + Math.exp(-0.00368208 * cpValue));
}

/** Win probability in [0,1] for an eval. Mate values collapse to 0 or 1. */
export function winPercent(evalValue: number, isMate: boolean): number {
  if (isMate) return evalValue > 0 ? 1 : 0;
  return sigmoidWinPercent(evalValue);
}

/**
 * Win probability lost by playing a move. The smaller this is, the better the
 * move kept the position's win chances. `playerColor` orients the evals so a
 * negative/positive eval is judged from the side that just moved.
 */
export function computeWPL(
  prevEvalValue: number, prevIsMate: boolean,
  currEvalValue: number, currIsMate: boolean,
  playerColor: "white" | "black",
): number {
  const side = playerColor === "white" ? 1 : -1;
  const prevWP = winPercent(prevEvalValue * side, prevIsMate);
  const currWP = winPercent(currEvalValue * side, currIsMate);
  return Math.max(0, prevWP - currWP);
}

/** Bucket a computed WPL into a coarse classification label. */
export function wplClassify(wpl: number): Classification {
  if (wpl <= WPL_THRESHOLDS.best) return Classification.BEST;
  if (wpl <= WPL_THRESHOLDS.excellent) return Classification.EXCELLENT;
  if (wpl <= WPL_THRESHOLDS.good) return Classification.GOOD;
  if (wpl <= WPL_THRESHOLDS.inaccuracy) return Classification.INACCURACY;
  if (wpl <= WPL_THRESHOLDS.mistake) return Classification.MISTAKE;
  return Classification.BLUNDER;
}

/**
 * Heuristic for "Miss": the opponent just made a sub-par move (high opponent
 * WPL) and we responded with a comparably poor move, i.e. we failed to punish
 * their mistake immediately.
 */
export function isMiss(
  opponentWPL: number | undefined,
  currentWPL: number,
): boolean {
  if (opponentWPL == null) return false;
  const threshold = WPL_THRESHOLDS.inaccuracy;
  return (
    opponentWPL >= threshold &&
    currentWPL >= opponentWPL * 0.7 &&
    currentWPL < opponentWPL * 1.4
  );
}

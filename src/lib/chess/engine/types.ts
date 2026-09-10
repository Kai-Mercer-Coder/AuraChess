/**
 * Engine result types.
 *
 * `LocalEvalResult` is the raw model of a single Stockfish evaluation
 * (multi-PV variant is exposed via `multiPv`); `EvalResult` is the normalized
 * shape consumed by the review pipeline; `HintData` powers the in-game hint.
 */

/** Engine output for a hint / live eval display. */
export interface HintData {
  bestmove: string;
  san: string;
  text: string;
  eval: number;
  mate: number | null;
  continuationArr: string[];
  winChance: number;
}

/** Raw result of a local (WASM) engine evaluation of one position. */
export interface LocalEvalResult {
    fen: string;
    eval: number;
    mate: number | null;
    bestmove: string;
    depth: number;
    pv: string[];
    multiPv: { eval: number; mate: number | null; pv: string[]; depth: number }[];
}

/** Normalized evaluation the review pipeline consumes (eval in pawns). */
export type EvalResult = {
    eval: number;
    mate: number | null;
    bestmove: string;
    san: string;
    continuationArr: string[];
};

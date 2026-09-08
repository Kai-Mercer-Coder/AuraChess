/**
 * Engine barrel — public surface of the `engine/` layer.
 *
 *  - `LocalStockfishEvalEngine` — single-query WASM Stockfish used during
 *    review sweeps (multi-PV evaluation of arbitrary positions).
 *  - `StockfishEngine`         — low-Elo bot used by play mode.
 *  - `fetchTablebase`          — Lichess endgame tablebase lookups.
 *  - Types                      — `HintData`, `LocalEvalResult`, `EvalResult`.
 */
export { LocalStockfishEvalEngine } from "./local-stockfish";
export { StockfishEngine } from "./stockfish";
export { fetchTablebase } from "./tablebase";
export type { HintData, LocalEvalResult, EvalResult } from "./types";
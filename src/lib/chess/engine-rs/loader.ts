"use client";

import init, {
  analyze as wasmAnalyze,
  analyze_pv as wasmAnalyzePv,
  evaluate_fen as wasmEvaluateFen,
  explain_position as wasmExplainPosition,
  piece_contributions as wasmPieceContributions,
  piece_value_at as wasmPieceValueAt,
  version as wasmVersion,
} from "./wasm-rs/engine_rs.js";

let ready = false;
let initPromise: Promise<boolean> | null = null;

export function ensureReady(): Promise<boolean> {
  if (ready) return Promise.resolve(true);
  if (!initPromise) {
    initPromise = init("/engine-rs/engine_rs_bg.wasm")
      .then(() => {
        ready = true;
        try {
          console.log("[engine-rs]", wasmVersion());
        } catch {
          /* ignore */
        }
        return true;
      })
      .catch((err) => {
        console.error("[engine-rs] init failed:", err);
        ready = false;
        return false;
      });
  }
  return initPromise;
}

export function isReady(): boolean {
  return ready;
}

export function analyzeMove(fenBefore: string, moveUci: string): any {
  if (!ready) return null;
  try {
    const result = wasmAnalyze(fenBefore, moveUci);
    if (!result || result.error) return null;
    return result;
  } catch (e) {
    console.warn("[engine-rs] analyze failed:", e);
    return null;
  }
}

export function analyzePv(startFen: string, ucis: string[], plies = 3): any {
  if (!ready) return null;
  try {
    const arr = wasmAnalyzePv(startFen, ucis, plies);
    if (!Array.isArray(arr)) return null;
    return arr;
  } catch (e) {
    console.warn("[engine-rs] analyze_pv failed:", e);
    return null;
  }
}

export function evaluateFen(fen: string): any {
  if (!ready) return null;
  try {
    const r = wasmEvaluateFen(fen);
    if (!r || r.error) return null;
    return r;
  } catch (e) {
    console.warn("[engine-rs] evaluate_fen failed:", e);
    return null;
  }
}

export function pieceContributionsForFen(fen: string): any {
  if (!ready) return null;
  try {
    const r = wasmPieceContributions(fen);
    if (!Array.isArray(r)) return null;
    return r;
  } catch (e) {
    console.warn("[engine-rs] piece_contributions failed:", e);
    return null;
  }
}

export function explainPosition(fen: string): any {
  if (!ready) return null;
  try {
    const r = wasmExplainPosition(fen);
    if (!r || r.error) return null;
    return r;
  } catch (e) {
    console.warn("[engine-rs] explain_position failed:", e);
    return null;
  }
}

export function pieceValueAt(fen: string, square: string): any {
  if (!ready) return null;
  try {
    const r = wasmPieceValueAt(fen, square);
    if (!r || r.error) return null;
    return r;
  } catch (e) {
    console.warn("[engine-rs] piece_value_at failed:", e);
    return null;
  }
}

if (typeof window !== "undefined") {
  ensureReady();
}
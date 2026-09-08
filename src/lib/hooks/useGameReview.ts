/**
 * Review orchestration hook.
 *
 * Runs the full game-review pipeline in the background:
 *   1. Sweep every position with the local WASM engine at increasing depths
 *      (13 → 15 → 18) across up to 3 passes; use tablebases for ≤7-piece
 *      endgames.
 *   2. Feed the evaluations into `analyse()` to produce the final Report.
 *
 * Exposes loading/progress state for the UI and lets callers reset/abort.
 */
"use client";

import { useState, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import { analyse } from "@/lib/chess/analyse";
import {
  LocalStockfishEvalEngine,
  fetchTablebase,
  type LocalEvalResult,
  type EvalResult,
} from "@/lib/chess/engine";
import type Report from "@/lib/types/Report";
import type { EvaluatedPosition } from "@/lib/types/Position";
import { Classification } from "@/lib/types/Classification";
import { toast } from "react-toastify";

type EvalResponse = EvalResult;

interface RunReviewOptions {
  maxPasses?: number;
  onDone?: (report: Report) => void;
}

interface UseGameReviewReturn {
  report: Report | null;
  loading: boolean;
  progress: number;
  total: number;
  deepLoading: boolean;
  analysisPass: number;
  completedMoves: number;
  runReview: (pgn: string, options?: RunReviewOptions) => Promise<void>;
  runDeepAnalysis: (pgn: string) => Promise<void>;
  reset: () => void;
}

export function useGameReview(): UseGameReviewReturn {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [deepLoading, setDeepLoading] = useState(false);
  const [analysisPass, setAnalysisPass] = useState(0);
  const [completedMoves, setCompletedMoves] = useState(0);
  const positionsRef = useRef<EvaluatedPosition[]>([]);
  const abortRef = useRef(false);

  const runReview = useCallback(async (pgn: string, options?: RunReviewOptions) => {
    if (!pgn.trim()) return;
    const maxPasses = options?.maxPasses ?? 3;
    setLoading(true);
    setReport(null);
    setAnalysisPass(1);
    setCompletedMoves(0);
    abortRef.current = false;

    let engine: LocalStockfishEvalEngine | null = null;

    try {
      const game = new Chess();
      game.loadPgn(pgn.trim());
      const allMoves = game.history({ verbose: true });
      if (allMoves.length === 0) {
        setLoading(false);
        setAnalysisPass(0);
        return;
      }

      setTotal(allMoves.length + 1);
      const positions: EvaluatedPosition[] = [];

      const startGame = new Chess();
      try {
        // One engine for the whole depth-13 sweep — spawning a worker per
        // position was the dominant overhead of this pass.
        engine = new LocalStockfishEvalEngine();
        const startEval = await evaluateFenToDepth(startGame.fen(), 13, engine);
        const startEvalCp = Math.round(startEval.eval * 100);
        const startMate = startEval.mate;
        positions.push({
          fen: startGame.fen(),
          move: { san: "", uci: "" },
          topLines: [{
            id: 1, depth: 13,
            evaluation: { type: startMate !== null ? "mate" : "cp", value: startMate ?? startEvalCp },
            moveUCI: startEval.bestmove, moveSAN: startEval.san
          }],
          cutoffEvaluation: undefined,
          classification: undefined,
          worker: "local"
        });
      } catch (err) {
        console.warn("Failed to evaluate starting position:", err);
        positions.push({
          fen: startGame.fen(),
          move: { san: "", uci: "" },
          topLines: [{
            id: 1, depth: 0,
            evaluation: { type: "cp", value: 0 },
            moveUCI: "", moveSAN: ""
          }],
          classification: undefined,
          worker: "local"
        });
      }

      setProgress(1);
      setCompletedMoves(1);

      const replay = new Chess();
      for (let i = 0; i < allMoves.length; i++) {
        if (abortRef.current) return;

        replay.move(allMoves[i]);
        const currentFen = replay.fen();

        try {
          const evalData = await evaluateFenToDepth(currentFen, 13, engine);
          const evalCp = Math.round(evalData.eval * 100);
          positions.push({
            fen: currentFen,
            move: { san: allMoves[i].san, uci: allMoves[i].from + allMoves[i].to },
            topLines: [{
              id: 1, depth: 13,
              evaluation: { type: evalData.mate !== null ? "mate" : "cp", value: evalData.mate ?? evalCp },
              moveUCI: evalData.bestmove, moveSAN: evalData.san,
              continuation: evalData.continuationArr || []
            }],
            classification: undefined,
            worker: "local"
          });
        } catch (err) {
          console.warn(`Failed to evaluate position ${i + 1}:`, err);
          positions.push({
            fen: currentFen,
            move: { san: allMoves[i].san, uci: allMoves[i].from + allMoves[i].to },
            topLines: [{
              id: 1, depth: 0,
              evaluation: { type: "cp", value: 0 },
              moveUCI: "", moveSAN: ""
            }],
            classification: undefined,
            worker: "local"
          });
        }

        setProgress(i + 2);
        setCompletedMoves(i + 2);
      }

      positionsRef.current = [...positions];
      const result = await analyse([...positions]);
      setReport(result);

      if (abortRef.current) return;

      toast.success("Depth 13 analysis complete", { autoClose: 1500 });

      if (maxPasses >= 2) {
        runPass2(pgn, positions, options);
      } else {
        setAnalysisPass(0);
        setLoading(false);
        options?.onDone?.(result);
      }
    } catch (err) {
      console.error("Game review failed:", err);
    } finally {
      engine?.terminate();
      setLoading(false);
    }
  }, []);

  const runPass2 = useCallback(async (pgn: string, basePositions: EvaluatedPosition[], options?: RunReviewOptions) => {
    setAnalysisPass(2);
    setCompletedMoves(0);
    const maxPasses = options?.maxPasses ?? 3;
    const engine = new LocalStockfishEvalEngine();
    const updated = basePositions.map(p => ({ ...p }));

    try {
      for (let i = 0; i < updated.length; i++) {
        if (abortRef.current) return;

        const pos = updated[i];
        const result = await engine.evaluateToDepth(pos.fen, 15);
        if (result.depth === 0) continue;

        const evalCp = Math.round(result.eval * 100);
        const oldEval = pos.topLines[0]?.evaluation.value ?? 0;
        const newEval = result.mate !== null ? (result.mate > 0 ? 10000 : -10000) : evalCp;

        updated[i] = {
          ...pos,
          topLines: [{
            id: 1, depth: 15,
            evaluation: { type: result.mate !== null ? "mate" : "cp", value: result.mate ?? evalCp },
            moveUCI: result.bestmove,
            moveSAN: "",
            continuation: result.pv.slice(1)
          }],
          worker: "local"
        };

        setCompletedMoves(i + 1);
      }

      const oldReport = positionsRef.current.map(p => p.classification);
      const newResult = await analyse(updated);

      let changedCount = 0;
      for (let i = 0; i < updated.length; i++) {
        if (oldReport[i] !== updated[i].classification && updated[i].classification) {
          changedCount++;
        }
      }

      positionsRef.current = updated;
      setReport(newResult);

      if (!abortRef.current) {
        if (changedCount > 0) {
          toast.info(`Depth 15: ${changedCount} classification${changedCount > 1 ? "s" : ""} updated`, { autoClose: 2000 });
        } else {
          toast.success("Depth 15 analysis complete", { autoClose: 1500 });
        }
        if (maxPasses >= 3) {
          runPass3(pgn, updated, options);
        } else {
          setAnalysisPass(0);
          setLoading(false);
          options?.onDone?.(newResult);
        }
      }
    } catch (err) {
      console.error("Pass 2 failed:", err);
    } finally {
      engine.terminate();
    }
  }, []);

  const runPass3 = useCallback(async (pgn: string, basePositions: EvaluatedPosition[], options?: RunReviewOptions) => {
    setAnalysisPass(3);
    setCompletedMoves(0);
    const engine = new LocalStockfishEvalEngine();
    const updated = basePositions.map(p => ({ ...p }));

    try {
      for (let i = 0; i < updated.length; i++) {
        if (abortRef.current) return;

        const pos = updated[i];
        const result = await engine.evaluateToDepth(pos.fen, 18);
        if (result.depth === 0) continue;

        const evalCp = Math.round(result.eval * 100);

        updated[i] = {
          ...pos,
          topLines: [{
            id: 1, depth: 18,
            evaluation: { type: result.mate !== null ? "mate" : "cp", value: result.mate ?? evalCp },
            moveUCI: result.bestmove,
            moveSAN: "",
            continuation: result.pv.slice(1)
          }],
          worker: "local"
        };

        setCompletedMoves(i + 1);
      }

      const oldReport = positionsRef.current.map(p => p.classification);
      const newResult = await analyse(updated);

      let changedCount = 0;
      for (let i = 0; i < updated.length; i++) {
        if (oldReport[i] !== updated[i].classification && updated[i].classification) {
          changedCount++;
        }
      }

      positionsRef.current = updated;
      setReport(newResult);

      if (!abortRef.current) {
        if (changedCount > 0) {
          toast.info(`Final: ${changedCount} classification${changedCount > 1 ? "s" : ""} updated`, { autoClose: 2000 });
        }
        toast.success("Analysis complete", { autoClose: 1500 });
        setAnalysisPass(0);
        setLoading(false);
        options?.onDone?.(newResult);
      }
    } catch (err) {
      console.error("Pass 3 failed:", err);
    } finally {
      engine.terminate();
    }
  }, []);

  const runDeepAnalysis = useCallback(async (pgn: string) => {
    if (!pgn.trim() || deepLoading) return;
    setDeepLoading(true);

    const engine = new LocalStockfishEvalEngine();
    const updated = [...positionsRef.current];

    try {
      for (let i = 0; i < updated.length; i++) {
        const pos = updated[i];
        const localResult = await engine.evaluatePosition(pos.fen, 5000);

        if (localResult.depth > 0 && localResult.eval !== (pos.topLines[0]?.evaluation.value ?? 0) / 100) {
          const evalCp = Math.round(localResult.eval * 100);
          updated[i] = {
            ...pos,
            topLines: [{
              id: 1,
              depth: localResult.depth,
              evaluation: {
                type: localResult.mate !== null ? "mate" : "cp",
                value: localResult.mate ?? evalCp,
              },
              moveUCI: localResult.bestmove,
              moveSAN: "",
            }],
            worker: "local",
          };
        }
      }

      const updatedReport = await analyse(updated);
      positionsRef.current = updated;
      setReport(updatedReport);
    } catch (err) {
      console.error("Deep analysis failed:", err);
    } finally {
      engine.terminate();
      setDeepLoading(false);
    }
  }, [deepLoading]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setReport(null);
    setLoading(false);
    setProgress(0);
    setTotal(0);
    setDeepLoading(false);
    setAnalysisPass(0);
    setCompletedMoves(0);
    positionsRef.current = [];
  }, []);

  return { report, loading, progress, total, deepLoading, analysisPass, completedMoves, runReview, runDeepAnalysis, reset };
}

// Lichess tablebases only cover positions with up to 7 pieces — skip the
// network call for everything else.
function countPieces(fen: string): number {
  const placement = fen.split(" ")[0];
  let count = 0;
  for (const ch of placement) {
    if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z")) count++;
  }
  return count;
}

async function evaluateFenToDepth(
  fen: string,
  depth: number,
  engine?: LocalStockfishEvalEngine | null,
): Promise<EvalResponse> {
  if (countPieces(fen) <= 7) {
    const tablebase = await fetchTablebase(fen);
    if (tablebase) {
      return {
        eval: tablebase.eval,
        mate: tablebase.mate,
        bestmove: tablebase.bestmove,
        san: "",
        continuationArr: tablebase.continuationArr,
        winChance: tablebase.winChance,
      };
    }
  }

  // Reuse the caller's engine when given so a sweep doesn't pay wasm
  // instantiation per position; otherwise own a short-lived one.
  const ownsEngine = !engine;
  const evalEngine = engine ?? new LocalStockfishEvalEngine();
  try {
    const result = await evalEngine.evaluateToDepth(fen, depth);
    const evalCp = Math.round(result.eval * 100);
    return {
      eval: result.eval,
      mate: result.mate,
      bestmove: result.bestmove,
      san: "",
      continuationArr: result.pv.slice(1),
      winChance: 50 + (evalCp / 200),
    };
  } finally {
    if (ownsEngine) evalEngine.terminate();
  }
}

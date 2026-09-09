"use client";

import {
  ensureReady,
  analyzeMove,
  analyzePv,
  evaluateFen,
  explainPosition,
  pieceContributionsForFen,
  pieceValueAt,
  isReady,
} from "./loader";
import { LRUCache } from "./cache";
import type {
  AnalysisMoveResult,
  ExplanationBlob,
  PieceContribution,
  PositionAnalysis,
} from "./types";

const EXPLANATION_CACHE_SIZE = 50;
const PIECE_VALUES_CACHE_SIZE = 50;

class RustAnalyzer {
  private static instance: RustAnalyzer | null = null;

  private explanationCache = new LRUCache<ExplanationBlob>(EXPLANATION_CACHE_SIZE);
  private pieceValuesCache = new LRUCache<Record<string, number>>(PIECE_VALUES_CACHE_SIZE);

  private constructor() {}

  static getInstance(): RustAnalyzer {
    if (!RustAnalyzer.instance) {
      RustAnalyzer.instance = new RustAnalyzer();
    }
    return RustAnalyzer.instance;
  }

  async initialize(): Promise<boolean> {
    return ensureReady();
  }

  isReady(): boolean {
    return isReady();
  }

  analyzeMove(fenBefore: string, moveUci: string): AnalysisMoveResult | null {
    return analyzeMove(fenBefore, moveUci) as AnalysisMoveResult | null;
  }

  analyzePv(startFen: string, ucis: string[], plies = 3): AnalysisMoveResult[] | null {
    return analyzePv(startFen, ucis, plies) as AnalysisMoveResult[] | null;
  }

  getExplanation(fen: string): ExplanationBlob | null {
    const cached = this.explanationCache.get(fen);
    if (cached) return cached;

    const blob = explainPosition(fen) as ExplanationBlob | null;
    if (blob) this.explanationCache.set(fen, blob);
    return blob;
  }

  getPieceValues(fen: string): Record<string, number> {
    const cached = this.pieceValuesCache.get(fen);
    if (cached) return cached;

    const contributions = pieceContributionsForFen(fen) as PieceContribution[] | null;
    const values: Record<string, number> = {};
    if (contributions) {
      for (const c of contributions) {
        values[c.square] = c.value_cp;
      }
    }
    this.pieceValuesCache.set(fen, values);
    return values;
  }

  getPieceValueAt(fen: string, square: string): number | null {
    const v = pieceValueAt(fen, square);
    return v && typeof v.value_cp === "number" ? v.value_cp : null;
  }

  getStaticEval(fen: string): {
    phase: number;
    final_cp: number;
    perSide: any;
  } | null {
    const ev = evaluateFen(fen);
    if (!ev) return null;
    return {
      phase: ev.phase,
      final_cp: ev.final_cp,
      perSide: { white: ev.white, black: ev.black },
    };
  }

  analyzePosition(fen: string): PositionAnalysis {
    const explanation = this.getExplanation(fen);
    const pieceValues = this.getPieceValues(fen);

    const hangingWhite = explanation?.tactics?.hanging_white ?? [];
    const hangingBlack = explanation?.tactics?.hanging_black ?? [];
    const kingSafety = explanation?.king_safety ?? { white: null, black: null };

    return {
      fen,
      explanation,
      pieceValues,
      hangingWhite,
      hangingBlack,
      kingSafety: kingSafety as any,
    };
  }
}

export { RustAnalyzer };
/**
 * Shared engine-related types.
 *
 * `Evaluation` is a Stockfish-formatted eval (centipawns or mate-in-N);
 * `EngineLine` is one row of a multi-PV engine output.
 */
import type { Chess } from 'chess.js';

export interface Evaluation {
    type: "cp" | "mate",
    value: number
}

export interface EngineLine {
    id: number,
    depth: number,
    evaluation: Evaluation,
    moveUCI: string,
    moveSAN?: string,
    continuation?: string[]
}

export interface PromotionMove {
  sourceSquare: string;
  targetSquare: string;
}

/**
 * Contract for any "auto-play" opponent engine used by play mode.
 * Implementations must produce the next move for `chessGame` (SAN string).
 */
export interface EngineClient {
  getNextMove(chessGame: Chess): string | null | Promise<string | null>;
  terminate?(): void;
  setElo?(elo: number): void;
}

export interface AnalysisState {
  isOverdefended: boolean;
  isUnderdefended: boolean;
  showCheckHighlights: boolean;
}

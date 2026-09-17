/**
 * Coach rule engine types.
 *
 * `CoachContext` exposes everything a rule could inspect: phase, move numbers,
 * eval (in centipawns and pawns), mate info, classification, the Rust WASM
 * blob, and precomputed tactic flags. Rules reference conditions by name in
 * `when`, plus an optional `check(ctx)` escape hatch for math like
 * `ctx.moveNumber + 10 > ctx.maxMove`.
 */
import type { Classification } from "@/lib/types/Classification";
import type { EvaluatedPosition } from "@/lib/types/Position";
import type { PositionAnalysis } from "@/lib/chess/engine-rs/types";

export type CoachTone = "good" | "warn" | "bad" | "info";

export interface CoachMessage {
  id: string;
  tone: CoachTone;
  text: string;
}

/** Phase buckets (push user's ask for transition windows OM / ME). */
export type PhaseId = "opening" | "om" | "middlegame" | "me" | "endgame";

/** Mate distances in full moves for either side (1 = mate next move). */
export interface MateInfo {
  /** Mover delivers mate in this many moves (positive) — null if none. */
  playerIn: number | null;
  /** Opponent delivers mate in this many moves (positive) — null if none. */
  opponentIn: number | null;
}

export interface CoachContext {
  position: EvaluatedPosition;
  previousPosition: EvaluatedPosition | null;
  /** Side that just played `position.move`. */
  player: "white" | "black";
  /** The opponent. */
  foe: "white" | "black";
  san: string;
  classification?: Classification;
  /** 1-based move number in the game (1 = first full move, regardless of color). */
  moveNumber: number;
  /** Total full moves in the game. */
  maxMove: number;
  phase: PhaseId;
  /** Top-line eval from the player's perspective, centipawns. Mate → ±MATE_NONE. */
  evalCp: number;
  /** Same, but as full pawns (cp / 100). */
  evalPawns: number;
  /** Eval of the previous position from the player's perspective (cp). */
  prevEvalCp: number;
  /** Improvement lost on this move = prevEvalCp - evalCp (positive = got worse). */
  swingCp: number;
  /** Mate distances (full moves) for player / opponent. */
  mate: MateInfo;
  /** Engine's top move from the previous position, as SAN (if known). */
  prevBestSan: string | null;
  /** True when the played move matches the engine's previous top move. */
  playedBest: boolean;
  /** Rust WASM analysis for this position (may be absent pre-analysis). */
  blob?: PositionAnalysis["explanation"];
  /** Rust WASM position analysis wrapper. */
  pa?: PositionAnalysis;
}

/** One declarative coach rule — the unit the user edits in rules.ts. */
export interface CoachRule {
  id: string;
  /** All named conditions must match: `{ isFork: true, isEndgame: false }`. */
  when?: Partial<Record<string, boolean>>;
  /** Optional arbitrary predicate over the context (numeric checks, etc.). */
  check?: (ctx: CoachContext) => boolean;
  /** Tone override; default is inferred from the move classification. */
  tone?: CoachTone;
  /** Candidate messages — one is picked deterministically per (game, move). */
  text: string[];
}
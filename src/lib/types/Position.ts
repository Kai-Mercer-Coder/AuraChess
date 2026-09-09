/**
 * Position model used by the review pipeline.
 * `Position` describes any board state; `EvaluatedPosition` is one that has
 * engine top lines attached and (once `analyse()` runs) a `classification`.
 */
import { Classification } from "./Classification";
import { EngineLine, Evaluation } from "./Engine";
import type { PositionAnalysis } from "@/lib/chess/engine-rs/types";

interface Move {
    san: string,
    uci: string
}

export interface Position {
    fen: string,
    move?: Move
}

export interface EvaluatedPosition extends Position {
    move: Move,
    topLines: EngineLine[],
    cutoffEvaluation?: Evaluation,
    classification?: Classification,
    opening?: string,
    worker: string,
    positionAnalysis?: PositionAnalysis
}

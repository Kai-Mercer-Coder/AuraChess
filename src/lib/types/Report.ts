/**
 * Result of a completed game review: per-side accuracies, classification
 * counts, and the fully annotated positions (move order preserved).
 */
import type { ClassificationCount } from "./Classification";
import type { EvaluatedPosition } from "./Position";

export default interface Report {
  accuracies: {
    white: number;
    black: number;
  };
  classifications: {
    white: ClassificationCount;
    black: ClassificationCount;
  };
  positions: EvaluatedPosition[];
}

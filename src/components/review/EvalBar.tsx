/**
 * Slim vertical evaluation bar that hugs the left edge of the review board.
 * The light band grows from the top as White's advantage increases; a small
 * floating pill shows the engine's evaluation for whichever side is better.
 */
"use client";

import type { Evaluation } from "@/lib/types/Engine";

interface EvalBarProps {
  evaluation?: Evaluation;
}

/** Evaluation → White win-share percentage (0-100). */
function evalToPercent(evaluation?: Evaluation): number {
  if (!evaluation) return 50;
  if (evaluation.type === "mate") {
    if (evaluation.value > 0) return 100;
    if (evaluation.value < 0) return 0;
    return 50;
  }
  const cp = Math.max(-400, Math.min(400, evaluation.value));
  return 50 + 25 * Math.tanh(cp / 200);
}

/** Compact label: "+1.24", "−0.75", or "M4". */
function evalLabel(evaluation?: Evaluation): string {
  if (!evaluation) return "0.0";
  if (evaluation.type === "mate") {
    return evaluation.value === 0 ? "½" : `M${Math.abs(evaluation.value)}`;
  }
  const pawns = evaluation.value / 100;
  return `${pawns >= 0 ? "+" : "−"}${Math.abs(pawns).toFixed(2)}`;
}

export function EvalBar({ evaluation }: EvalBarProps) {
  const pct = evalToPercent(evaluation);
  const whiteBetter = pct >= 50;
  return (
    <div className="relative w-3 shrink-0 self-stretch">
      <div className="absolute inset-0 overflow-hidden rounded-full border border-white/[0.08] bg-neutral-950">
        <div
          className="absolute inset-x-0 top-0 bg-neutral-200 transition-all duration-300"
          style={{ height: `${pct}%` }}
        />
        <div
          className="absolute inset-x-0 bottom-0 bg-neutral-800 transition-all duration-300"
          style={{ height: `${100 - pct}%` }}
        />
      </div>
      <span
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-1 py-0.5 text-[7px] font-bold leading-none tabular-nums"
        style={{
          backgroundColor: whiteBetter ? "#f5f5f5" : "#1c1c1c",
          color: whiteBetter ? "#0a0a0a" : "#f5f5f5",
          boxShadow: "0 0 0 2px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.5)",
        }}
      >
        {evalLabel(evaluation)}
      </span>
    </div>
  );
}
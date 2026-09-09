/**
 * Session summary card shown once a Report is ready.
 * Opening name (when known) plus per-side accuracy as thin progress bars.
 */
"use client";

import type Report from "@/lib/types/Report";
import {
  accuracyBarColor,
  accuracyColor,
} from "@/components/review/classificationVisuals";

interface AccuracyCardsProps {
  report: Report;
}

function PlayerMark({ side }: { side: "white" | "black" }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full ${
        side === "white"
          ? "bg-[#f5f5f5]"
          : "bg-neutral-900 ring-1 ring-white/40"
      }`}
    />
  );
}

function PlayerRow({ side, accuracy }: { side: "white" | "black"; accuracy: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className="flex items-center gap-2 text-white/60">
          <PlayerMark side={side} />
          <span className="capitalize">{side}</span>
        </span>
        <span className={`font-semibold tabular-nums ${accuracyColor(accuracy)}`}>
          {accuracy.toFixed(1)}%
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${accuracy}%`, backgroundColor: accuracyBarColor(accuracy) }}
        />
      </div>
    </div>
  );
}

export function AccuracyCards({ report }: AccuracyCardsProps) {
  const opening = report.positions.find((p) => p.opening)?.opening;
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 fade-up">
      <div className="mb-3.5 flex items-baseline justify-between gap-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
          This game
        </span>
        {opening && (
          <span className="truncate text-[11px] font-light text-white/40" title={opening}>
            {opening}
          </span>
        )}
      </div>
      <div className="space-y-3">
        <PlayerRow side="white" accuracy={report.accuracies.white} />
        <PlayerRow side="black" accuracy={report.accuracies.black} />
      </div>
    </div>
  );
}
/**
 * Per-side accuracy cards shown once a Report is ready.
 * Color is derived from the accuracy via `accuracyColor`.
 */
"use client";

import type Report from "@/lib/types/Report";
import { accuracyColor } from "@/components/review/classificationVisuals";

interface AccuracyCardsProps {
  report: Report;
}

export function AccuracyCards({ report }: AccuracyCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="rounded-xl p-4 bg-white/[0.04] border border-white/[0.04]">
        <div className="text-[10px] uppercase tracking-wider text-white/30">
          White
        </div>
        <div className={`text-2xl font-bold ${accuracyColor(report.accuracies.white)}`}>
          {report.accuracies.white.toFixed(1)}%
        </div>
      </div>
      <div className="rounded-xl p-4 bg-white/[0.04] border border-white/[0.04]">
        <div className="text-[10px] uppercase tracking-wider text-white/30">
          Black
        </div>
        <div className={`text-2xl font-bold ${accuracyColor(report.accuracies.black)}`}>
          {report.accuracies.black.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
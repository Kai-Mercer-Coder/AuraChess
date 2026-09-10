/**
 * Inline progress indicator shown while the engine is analysing.
 * A thin animated bar + the current position + pass/depth badge.
 */
"use client";

interface ReviewProgressProps {
  progress: number;
  total: number;
  analysisPass?: number;
}

export function ReviewProgress({ progress, total, analysisPass }: ReviewProgressProps) {
  const pct = total > 0 ? Math.min(100, (progress / total) * 100) : 0;
  const depth = analysisPass ? 12 + analysisPass * 2 : 14;
  return (
    <div className="mb-6 fade-up">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11px] font-light text-white/50">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Analysing position {progress}/{total}
        </span>
        {analysisPass ? (
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] tabular-nums text-white/40">
            pass {analysisPass}/3 · depth {depth}
          </span>
        ) : null}
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-white/70 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
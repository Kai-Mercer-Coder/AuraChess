/**
 * Inline progress indicator shown while the engine is analysing.
 * Purely informational; driven by `progress`/`total` from `useGameReview`.
 */
"use client";

interface ReviewProgressProps {
  progress: number;
  total: number;
}

export function ReviewProgress({ progress, total }: ReviewProgressProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6 text-sm text-white/60">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      Analysing position {progress}/{total}
    </div>
  );
}
/**
 * Board navigation controls under the review board: step backward / forward
 * through the game with a live move counter and current-move classification.
 */
"use client";

import {
  classificationVisuals,
  reviewCategories,
} from "@/components/review/classificationVisuals";

interface ReviewNavigationProps {
  hasPrevious: boolean;
  hasNext: boolean;
  navIndex: number;
  total: number;
  classification?: string;
  onPrevious: () => void;
  onNext: () => void;
}

function NavBtn({ disabled, onClick, icon }: { disabled: boolean; onClick: () => void; icon: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-all hover:bg-white/[0.06] hover:text-white disabled:cursor-default disabled:opacity-20 disabled:hover:bg-transparent"
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  );
}

export function ReviewNavigation({
  hasPrevious,
  hasNext,
  navIndex,
  total,
  classification,
  onPrevious,
  onNext,
}: ReviewNavigationProps) {
  const label = classification
    ? (reviewCategories.find((c) => c.key === classification)?.label ?? classification)
    : undefined;
  const color = classification
    ? (classificationVisuals[classification]?.badgeBg ?? "#fff")
    : undefined;

  // navIndex = plies played; odd → White just moved (light dot), even → Black.
  const whiteToMove = navIndex % 2 === 0;
  const moveNo = navIndex === 0 ? 0 : Math.ceil(navIndex / 2);
  const totalMoves = Math.max(1, Math.ceil(total / 2));

  return (
    <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-1.5 py-1">
      <NavBtn disabled={!hasPrevious} onClick={onPrevious} icon="chevron_left" />
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              whiteToMove ? "bg-[#f5f5f5]" : "bg-neutral-700 ring-1 ring-white/40"
            }`}
            title={whiteToMove ? "White to move" : "Black to move"}
          />
          <span className="text-[12px] font-medium leading-none tabular-nums text-white/70">
            {navIndex === 0 ? "Start" : `Move ${moveNo}`}
            <span className="text-white/30"> / {totalMoves}</span>
          </span>
        </div>
        {label && (
          <span
            className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
            style={{ color }}
          >
            {label}
          </span>
        )}
      </div>
      <NavBtn disabled={!hasNext} onClick={onNext} icon="chevron_right" />
    </div>
  );
}
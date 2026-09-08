/**
 * Board navigation controls under the review board:
 * step backward / forward through the game, or start a brand new review.
 */
"use client";

interface ReviewNavigationProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onNew: () => void;
}

export function ReviewNavigation({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onNew,
}: ReviewNavigationProps) {
  return (
    <div className="mt-5 flex items-center justify-center gap-2">
      <button
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="p-2.5 rounded-full bg-white/[0.05] hover:bg-white/10 disabled:opacity-20"
      >
        <span className="material-symbols-outlined text-xl">chevron_left</span>
      </button>
      <button
        onClick={onNew}
        className="px-4 py-2 rounded-full bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-neutral-200"
      >
        New
      </button>
      <button
        onClick={onNext}
        disabled={!hasNext}
        className="p-2.5 rounded-full bg-white/[0.05] hover:bg-white/10 disabled:opacity-20"
      >
        <span className="material-symbols-outlined text-xl">chevron_right</span>
      </button>
    </div>
  );
}
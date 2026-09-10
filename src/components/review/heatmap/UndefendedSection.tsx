/** Undefended section: vulnerable-piece list (the ring lives on the board). */
"use client";

import { tagHanging } from "@/lib/chess/heatmap";
import type { HangingRef } from "@/lib/chess/engine-rs/types";

interface UndefendedSectionProps {
  hangingWhite: HangingRef[];
  hangingBlack: HangingRef[];
}

export function UndefendedSection({ hangingWhite, hangingBlack }: UndefendedSectionProps) {
  const hanging = tagHanging(hangingWhite, hangingBlack);
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-light leading-relaxed text-white/50">
        Vulnerable pieces glow with a red ring on the board.
      </p>
      {hanging.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {hanging.map((h) => (
            <span
              key={`${h.side}-${h.square}-${h.role}`}
              className="inline-flex items-center rounded-full border border-red-500/15 bg-red-500/[0.08] px-2 py-0.5 text-[10px] font-medium text-red-200/80"
            >
              {h.side} {h.role} {h.square} (−{Math.round(h.loss_cp / 100)})
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] font-light text-white/35">Nothing hanging here.</p>
      )}
    </div>
  );
}

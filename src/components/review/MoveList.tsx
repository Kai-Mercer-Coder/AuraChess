/**
 * Scrollable move-by-move list.
 *
 * Renders the game as numbered pairs; each ply carries a classification chip
 * (tiny glowing dot) and is clickable to navigate the board (`onSelectMove`
 * gets the half-move index). Shows a placeholder while positions are pending.
 */
"use client";

import type { EvaluatedPosition } from "@/lib/types/Position";
import { classificationVisuals } from "@/components/review/classificationVisuals";

interface MoveListProps {
  moves: string[];
  positions: EvaluatedPosition[];
  navIndex: number;
  onSelectMove: (index: number) => void;
}

/** Tiny glowing dot summarizing a move's classification. */
function MoveGlyph({ cls }: { cls?: string }) {
  if (!cls) return null;
  const color = classificationVisuals[cls]?.badgeBg ?? "#666";
  return (
    <span
      className="h-[5px] w-[5px] shrink-0 rounded-[2px]"
      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}55` }}
    />
  );
}

export function MoveList({ moves, positions, navIndex, onSelectMove }: MoveListProps) {
  // Pile up the moves into numbered white/black pairs, carrying each side's
  // classification. Classification for move i lives on positions[i] (which is
  // the position AFTER that move — see analyse.ts).
  const movePairs: {
    num: number;
    white: string;
    black: string;
    whiteClass?: string;
    blackClass?: string;
    whiteIdx: number;
    blackIdx: number;
  }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    const whitePos = positions[i + 1];
    const blackPos = positions[i + 2];
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i] ?? "",
      black: moves[i + 1] ?? "",
      whiteClass: whitePos?.classification,
      blackClass: blackPos?.classification,
      whiteIdx: i,
      blackIdx: i + 1,
    });
  }

  return (
    <div className="flex max-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
          Moves
        </span>
        <span className="text-[10px] tabular-nums text-white/30">
          {Math.ceil(moves.length / 2)} moves
        </span>
      </div>
      <div className="flex-1 space-y-px overflow-y-auto p-1.5 custom-scrollbar">
        {movePairs.length === 0 ? (
          <div className="py-10 text-center text-sm font-light text-white/25">
            Analysing…
          </div>
        ) : (
          movePairs.map((pair) => {
            const active =
              navIndex === pair.whiteIdx + 1 || navIndex === pair.blackIdx + 1;
            return (
              <div
                key={pair.num}
                className={`grid grid-cols-[2.75rem_1fr_1fr] items-center rounded-lg ${
                  active ? "bg-white/[0.05]" : "transition-colors hover:bg-white/[0.02]"
                }`}
              >
                <span className="pl-3 text-[10px] tabular-nums text-white/25">
                  {pair.num}.
                </span>
                <button
                  onClick={() => onSelectMove(pair.whiteIdx + 1)}
                  className={`flex items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-[12.5px] transition-colors ${
                    navIndex === pair.whiteIdx + 1
                      ? "font-medium text-white"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <MoveGlyph cls={pair.whiteClass} />
                  {pair.white}
                </button>
                <button
                  onClick={() => pair.black && onSelectMove(pair.blackIdx + 1)}
                  className={`flex items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-[12.5px] transition-colors ${
                    navIndex === pair.blackIdx + 1
                      ? "font-medium text-white"
                      : "text-white/40 hover:text-white/75"
                  }`}
                >
                  <MoveGlyph cls={pair.blackClass} />
                  {pair.black || "—"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
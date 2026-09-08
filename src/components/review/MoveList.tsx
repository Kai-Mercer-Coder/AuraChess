/**
 * Scrollable move-by-move list.
 *
 * Renders the game as numbered pairs; each ply carries a classification chip
 * (colored dot) and is clickable to navigate the board (`onSelectMove` gets the
 * half-move index). Shows a placeholder while positions are still pending.
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

/** Colored dot summarizing a move's classification (same hue as badge/square). */
function chip(cls?: string) {
  if (!cls) return null;
  const vis = classificationVisuals[cls];
  return (
    <span
      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full shrink-0"
      style={{ backgroundColor: vis?.badgeBg ?? "#666" }}
      title={cls}
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
    <div className="rounded-xl border border-white/[0.06] overflow-hidden max-h-[480px] flex flex-col">
      <div className="px-4 py-2.5 border-b border-white/[0.04] text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
        Moves
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {movePairs.length === 0 ? (
          <div className="text-white/20 text-sm text-center py-10">Analysing…</div>
        ) : (
          movePairs.map((pair) => {
            const active =
              navIndex === pair.whiteIdx + 1 || navIndex === pair.blackIdx + 1;
            return (
              <div
                key={pair.num}
                className="grid grid-cols-12 items-center px-2 py-1.5 rounded-lg"
                style={{
                  background: active ? "rgba(255,255,255,0.04)" : "transparent",
                }}
              >
                <div className="col-span-2 text-[10px] text-white/30">
                  {pair.num}
                </div>
                <button
                  onClick={() => onSelectMove(pair.whiteIdx + 1)}
                  className={`col-span-4 text-[13px] text-left flex items-center gap-1.5 ${
                    navIndex === pair.whiteIdx + 1
                      ? "text-amber-400"
                      : "text-white/60"
                  }`}
                >
                  {pair.white} {chip(pair.whiteClass)}
                </button>
                <button
                  onClick={() => pair.black && onSelectMove(pair.blackIdx + 1)}
                  className={`col-span-4 text-[13px] text-left flex items-center gap-1.5 ${
                    navIndex === pair.blackIdx + 1
                      ? "text-amber-400"
                      : "text-white/40"
                  }`}
                >
                  {pair.black || "-"} {chip(pair.blackClass)}
                </button>
                <div className="col-span-2" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
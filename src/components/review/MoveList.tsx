/**
 * Scrollable move-by-move list.
 *
 * Renders the game as numbered pairs; each ply carries a classification chip
 * (tiny glowing dot) and is clickable to navigate the board (`onSelectMove`
 * gets the half-move index). Shows a placeholder while positions are pending.
 */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { EvaluatedPosition } from "@/lib/types/Position";
import { classificationVisuals } from "@/components/review/classificationVisuals";

interface MoveListProps {
  moves: string[];
  positions: EvaluatedPosition[];
  navIndex: number;
  onSelectMove: (index: number) => void;
  analysing?: boolean;
  analysedCount?: number;
  open: boolean;
  onToggle: () => void;
}

type GlyphState = "pending" | "done" | "active";

/**
 * Per-ply glyph: a soft green orb when analysis is in progress (the "active"
 * one pulses as it's being computed), otherwise the classification dot.
 */
function MoveGlyph({ cls, state }: { cls?: string; state?: GlyphState }) {
  if (state === "done" || state === "active") {
    return (
      <span
        className={`h-[5px] w-[5px] shrink-0 rounded-full ${
          state === "active" ? "animate-pulse" : ""
        }`}
        style={{
          backgroundColor: "#34d399",
          boxShadow: "0 0 6px rgba(52, 211, 153, 0.55)",
        }}
      />
    );
  }
  if (!cls) return null;
  const color = classificationVisuals[cls]?.badgeBg ?? "#666";
  return (
    <span
      className="h-[5px] w-[5px] shrink-0 rounded-[2px]"
      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}55` }}
    />
  );
}

export function MoveList({
  moves,
  positions,
  navIndex,
  onSelectMove,
  analysing,
  analysedCount,
  open,
  onToggle,
}: MoveListProps) {
  // The move at ply index `i` is finished once the position after it has been
  // evaluated: analysedCount (positions evaluated, incl. the start) > i + 1.
  const plyState = (index: number): GlyphState | undefined => {
    if (!analysing || analysedCount == null) return undefined;
    if (index === analysedCount - 2) return "active";
    return analysedCount > index + 1 ? "done" : undefined;
  };
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
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/[0.03]"
      >
        <span className="flex items-center gap-2 text-[12px] font-medium text-white/70">
          <span className="material-symbols-outlined text-[16px] text-white/40">
            list
          </span>
          Moves
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[10px] tabular-nums text-white/30">
            {Math.ceil(moves.length / 2)} moves
          </span>
          <span
            className={`material-symbols-outlined text-[18px] text-white/30 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          >
            expand_more
          </span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="max-h-[400px] space-y-px overflow-y-auto border-t border-white/[0.04] p-1.5 custom-scrollbar">
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
                        <MoveGlyph cls={pair.whiteClass} state={plyState(pair.whiteIdx)} />
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
                        <MoveGlyph cls={pair.blackClass} state={plyState(pair.blackIdx)} />
                        {pair.black || "—"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
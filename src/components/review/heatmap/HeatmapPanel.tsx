/**
 * Heatmap panel shell: accordion header, kind selector (from HEATMAP_KINDS),
 * and the active kind's section. To surface a new kind, append it to the
 * registry and add one branch below — animation and accordion stay untouched.
 */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  HEATMAP_KINDS,
  type SpaceHeatmap,
  type KingHeatmap,
  type HeatmapKind,
  type SpaceMode,
  type KingMode,
} from "@/lib/chess/heatmap";
import type { HangingRef } from "@/lib/chess/engine-rs/types";
import { Segmented } from "./controls";
import { SpaceSection } from "./SpaceSection";
import { UndefendedSection } from "./UndefendedSection";
import { KingSection } from "./KingSection";

interface HeatmapPanelProps {
  kind: HeatmapKind;
  onKindChange: (kind: HeatmapKind) => void;
  space: SpaceHeatmap;
  spaceMode: SpaceMode;
  onSpaceModeChange: (mode: SpaceMode) => void;
  king: KingHeatmap;
  kingMode: KingMode;
  onKingModeChange: (mode: KingMode) => void;
  hangingWhite: HangingRef[];
  hangingBlack: HangingRef[];
  open: boolean;
  onToggle: () => void;
}

export function HeatmapPanel({
  kind,
  onKindChange,
  space,
  spaceMode,
  onSpaceModeChange,
  king,
  kingMode,
  onKingModeChange,
  hangingWhite,
  hangingBlack,
  open,
  onToggle,
}: HeatmapPanelProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] fade-up">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/[0.03]"
      >
        <span className="flex items-center gap-2 text-[12px] font-medium text-white/70">
          <span className="material-symbols-outlined text-[16px] text-white/40">
            grid_on
          </span>
          Heatmap
        </span>
        <span
          className={`material-symbols-outlined text-[18px] text-white/30 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          expand_more
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
            <div className="space-y-3 border-t border-white/[0.04] px-4 py-3">
              <Segmented options={HEATMAP_KINDS} value={kind} onChange={onKindChange} />

              {kind === "space" && (
                <SpaceSection
                  space={space}
                  spaceMode={spaceMode}
                  onSpaceModeChange={onSpaceModeChange}
                />
              )}
              {kind === "undefended" && (
                <UndefendedSection
                  hangingWhite={hangingWhite}
                  hangingBlack={hangingBlack}
                />
              )}
              {kind === "king" && (
                <KingSection
                  king={king}
                  kingMode={kingMode}
                  onKingModeChange={onKingModeChange}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

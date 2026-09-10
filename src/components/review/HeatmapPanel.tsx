/**
 * Heatmap panel.
 *
 * Minimizable accordion card (same pattern as Moves / Position
 * intelligence) controlling the board reachability overlay: squares the side
 * to move can travel to (emerald), squares the opponent can reach (red), and
 * squares both can reach (purple). Mode switch filters the overlay.
 */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { HeatmapData, HeatmapMode } from "@/lib/chess/heatmap";

interface HeatmapPanelProps {
  data: HeatmapData;
  mode: HeatmapMode;
  onModeChange: (mode: HeatmapMode) => void;
  open: boolean;
  onToggle: () => void;
}

const MODES: { key: HeatmapMode; label: string }[] = [
  { key: "all", label: "All" },
  { key: "white", label: "White" },
  { key: "black", label: "Black" },
];

export function HeatmapPanel({ data, mode, onModeChange, open, onToggle }: HeatmapPanelProps) {
  const turnLabel = data.turn === "white" ? "White to move" : "Black to move";

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
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/30">
                {turnLabel} · White perspective
              </div>

              {/* Mode selector */}
              <div className="flex rounded-full border border-white/[0.07] bg-black/25 p-0.5">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => onModeChange(m.key)}
                    className={`flex-1 rounded-full px-2 py-1 text-[11px] font-medium transition-all ${
                      mode === m.key
                        ? "bg-white/[0.12] text-white"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Zone legend with live counts */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <LegendDot color="#34d399" label={`White · ${data.white.length}`} />
                <LegendDot color="#ef4444" label={`Black · ${data.black.length}`} />
                <LegendDot color="#a855f7" label={`Contested · ${data.contested.length}`} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-light tabular-nums text-white/50">
      <span
        className="h-2 w-2 rounded-[3px]"
        style={{ backgroundColor: color, opacity: 0.85 }}
      />
      {label}
    </span>
  );
}

/**
 * Heatmap panel.
 *
 * Minimizable accordion card (same pattern as Moves / Position
 * intelligence) hosting every board overlay, organized by heatmap kind so
 * new visualizations slot in (Space, Undefended, King space today):
 * - Space: reachability zones (White emerald, Black red, contested purple).
 * - Undefended: vulnerable pieces glow with the red ring on the board.
 * - King space: safe neighboring squares for each king, theoretical
 *   (own pieces included) or strict (actually movable-to) flavor.
 */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import type {
  SpaceHeatmap,
  KingHeatmap,
  HeatmapKind,
  SpaceMode,
  KingMode,
} from "@/lib/chess/heatmap";
import type { HangingRef } from "@/lib/chess/engine-rs/types";

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

const KINDS: { key: HeatmapKind; label: string; icon: string }[] = [
  { key: "space", label: "Space", icon: "grid_on" },
  { key: "undefended", label: "Undefended", icon: "warning" },
  { key: "king", label: "King space", icon: "shield" },
];

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
  const hanging = [
    ...hangingWhite.map((h) => ({ ...h, side: "W" as const })),
    ...hangingBlack.map((h) => ({ ...h, side: "B" as const })),
  ];

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
              {/* Heatmap kind selector — extend KINDS to add future maps */}
              <Segmented
                options={KINDS}
                value={kind}
                onChange={onKindChange}
              />

              {kind === "space" && (
                <div className="space-y-3">
                  <div className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/30">
                    {space.turn === "white" ? "White to move" : "Black to move"} · White
                    perspective
                  </div>
                  <Segmented
                    options={[
                      { key: "all", label: "All" },
                      { key: "white", label: "White" },
                      { key: "black", label: "Black" },
                    ]}
                    value={spaceMode}
                    onChange={onSpaceModeChange}
                  />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <LegendDot color="#34d399" label={`White · ${space.white.length}`} />
                    <LegendDot color="#ef4444" label={`Black · ${space.black.length}`} />
                    <LegendDot color="#a855f7" label={`Contested · ${space.contested.length}`} />
                  </div>
                </div>
              )}

              {kind === "undefended" && (
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
                    <p className="text-[11px] font-light text-white/35">
                      Nothing hanging here.
                    </p>
                  )}
                </div>
              )}

              {kind === "king" && (
                <div className="space-y-3">
                  <Segmented
                    options={[
                      { key: "theoretical", label: "Theoretical" },
                      { key: "strict", label: "Strict" },
                    ]}
                    value={kingMode}
                    onChange={onKingModeChange}
                  />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <LegendDot color="#34d399" label={`White king · ${king.white.length}`} />
                    <LegendDot color="#ef4444" label={`Black king · ${king.black.length}`} />
                  </div>
                  <p className="text-[10px] font-light leading-relaxed text-white/35">
                    {kingMode === "theoretical"
                      ? "Every neighboring square free of enemy attacks — own pieces included."
                      : "Only squares the king could actually move to — no enemy attacks, no own pieces."}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; icon?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full border border-white/[0.07] bg-black/25 p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-all ${
            value === o.key
              ? "bg-white/[0.12] text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          {o.icon && (
            <span className="material-symbols-outlined text-[14px]">{o.icon}</span>
          )}
          {o.label}
        </button>
      ))}
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

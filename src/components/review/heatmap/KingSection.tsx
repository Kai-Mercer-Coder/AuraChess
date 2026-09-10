/** King space section: theoretical/strict flavor + per-king safe counts. */
"use client";

import type { KingHeatmap, KingMode } from "@/lib/chess/heatmap";
import { Segmented, LegendDot } from "./controls";

interface KingSectionProps {
  king: KingHeatmap;
  kingMode: KingMode;
  onKingModeChange: (mode: KingMode) => void;
}

export function KingSection({ king, kingMode, onKingModeChange }: KingSectionProps) {
  return (
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
  );
}

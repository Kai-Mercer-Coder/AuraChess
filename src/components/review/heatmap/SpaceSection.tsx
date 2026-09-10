/** Space section: zone filter + live reach counts. */
"use client";

import type { SpaceHeatmap, SpaceMode } from "@/lib/chess/heatmap";
import { Segmented, LegendDot } from "./controls";

interface SpaceSectionProps {
  space: SpaceHeatmap;
  spaceMode: SpaceMode;
  onSpaceModeChange: (mode: SpaceMode) => void;
}

export function SpaceSection({ space, spaceMode, onSpaceModeChange }: SpaceSectionProps) {
  return (
    <div className="space-y-3">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/30">
        {space.turn === "white" ? "White to move" : "Black to move"} · White perspective
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
  );
}

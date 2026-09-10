/**
 * Shared heatmap vocabulary: kinds, modes, zone shapes, colors, registry.
 *
 * The registry is the single list driving the kind selector — appending a
 * new heatmap kind here (plus its lib module + section component, see
 * index.ts) is enough to surface it in the UI.
 */
export type HeatmapKind = "space" | "undefended" | "king";
export type SpaceMode = "all" | "white" | "black";
export type KingMode = "theoretical" | "strict";

/** White/black square lists; extra fields per kind below. */
export interface ZoneData {
  white: string[];
  black: string[];
}

export interface SpaceHeatmap extends ZoneData {
  contested: string[];
  turn: "white" | "black";
}

export interface KingHeatmap extends ZoneData {
  turn: "white" | "black";
}

/** Fill colors per zone (tints, so pieces stay readable underneath). */
export const HEATMAP_COLORS = {
  white: "rgba(52, 211, 153, 0.28)",
  black: "rgba(239, 68, 68, 0.30)",
  contested: "rgba(168, 85, 247, 0.34)",
} as const;

/** Kind selector entries, in display order. */
export const HEATMAP_KINDS: { key: HeatmapKind; label: string; icon: string }[] = [
  { key: "space", label: "Space", icon: "grid_on" },
  { key: "undefended", label: "Undefended", icon: "warning" },
  { key: "king", label: "King space", icon: "shield" },
];

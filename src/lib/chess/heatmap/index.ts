/**
 * Heatmap modules, organized by kind.
 *
 * To add a new heatmap kind:
 * 1. Create `src/lib/chess/heatmap/<kind>.ts` with a `compute<Kind>Heatmap`.
 * 2. Create `src/components/review/heatmap/<Kind>Section.tsx` for its options.
 * 3. Append one entry to HEATMAP_KINDS (types.ts) + one branch in HeatmapPanel.
 * Overlay plumbing, animation, and accordion stay untouched.
 */
export * from "./types";
export * from "./squares";
export * from "./space";
export * from "./king";
export * from "./undefended";
export * from "./overlay";

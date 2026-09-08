/**
 * Review UI vocabulary: classification → label/color/badge metadata.
 *
 * Shared lookup tables used by the move list (chips), the legend, the per-side
 * accuracy coloring, and the board's last-move annotation.
 */
"use client";

/**
 * Ordered list for the review legend. `key` mirrors the Classification enum
 * value; `color` is a Tailwind text class; labels are the human-facing names.
 */
const reviewCategories: { key: string; label: string; color: string; icon: string | React.ReactNode }[] = [
  { key: "brilliant", label: "Mastermind", color: "text-teal-400", icon: "" },
  { key: "great", label: "Great", color: "text-blue-800", icon: "" },
  { key: "best", label: "Best", color: "text-lime-400", icon: "" },
  { key: "excellent", label: "Excellent", color: "text-lime-400", icon: "" },
  { key: "good", label: "Good", color: "text-green-800", icon: "" },
  { key: "book", label: "Book", color: "text-amber-800", icon: "" },
  { key: "theory", label: "Theory", color: "text-amber-800", icon: "" },
  { key: "inaccuracy", label: "Inaccuracy", color: "text-yellow-500", icon: "" },
  { key: "mistake", label: "Mistake", color: "text-orange-500", icon: "" },
  { key: "critical", label: "Critical", color: "text-orange-500", icon: "" },
  { key: "blunder", label: "Blunder", color: "text-red-500", icon: "" },
  { key: "miss", label: "Miss", color: "text-red-300", icon: "" },
  { key: "risky", label: "Risky", color: "text-red-300", icon: "" },
  { key: "forced", label: "Forced", color: "text-white", icon: "" },
];

/** Small white dot used as the "best move" badge glyph. */
function CenterDot({ size = 6 }: { size?: number }) {
  return (
    <span
      className="inline-block rounded-full bg-white"
      style={{ width: size, height: size }}
    />
  );
}

/** Tailwind color class for a 0–100 accuracy percentage. */
function accuracyColor(acc: number) {
  if (acc >= 90) return "text-teal-400";
  if (acc >= 75) return "text-lime-400";
  if (acc >= 60) return "text-yellow-500";
  if (acc >= 40) return "text-orange-500";
  return "text-red-500";
}

/**
 * Per-classification styling: `bg` is a translucent tint for squares, `badgeBg`
 * is the solid chip/badge color, `icon` is an optional inline glyph (used on
 * the board when no dedicated badge PNG exists).
 */
const classificationVisuals: Record<string, { bg: string; badgeBg: string; icon: string | React.ReactNode }> = {
  brilliant: { bg: "rgba(45,212,191,0.18)", badgeBg: "#2dd4bf", icon: "" },
  great: { bg: "rgba(30,64,175,0.18)", badgeBg: "#1e40af", icon: "" },
  best: { bg: "rgba(163,230,53,0.18)", badgeBg: "#a3e635", icon: <CenterDot /> },
  excellent: { bg: "rgba(163,230,53,0.18)", badgeBg: "#a3e635", icon: "" },
  good: { bg: "rgba(22,101,52,0.18)", badgeBg: "#166534", icon: "" },
  book: { bg: "rgba(161,98,7,0.18)", badgeBg: "#a16207", icon: "" },
  theory: { bg: "rgba(161,98,7,0.18)", badgeBg: "#a16207", icon: "" },
  inaccuracy: { bg: "rgba(234,179,8,0.18)", badgeBg: "#eab308", icon: "" },
  mistake: { bg: "rgba(249,115,22,0.18)", badgeBg: "#f97316", icon: "" },
  critical: { bg: "rgba(249,115,22,0.18)", badgeBg: "#f97316", icon: "" },
  blunder: { bg: "rgba(239,68,68,0.18)", badgeBg: "#ef4444", icon: "" },
  miss: { bg: "rgba(252,165,165,0.18)", badgeBg: "#fca5a5", icon: "" },
  risky: { bg: "rgba(252,165,165,0.18)", badgeBg: "#fca5a5", icon: "" },
  forced: { bg: "rgba(255,255,255,0.18)", badgeBg: "#ffffff", icon: "" },
};

export { accuracyColor, reviewCategories, classificationVisuals };
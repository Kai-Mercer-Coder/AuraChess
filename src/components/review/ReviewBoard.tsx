/**
 * Review board with move annotations.
 *
 * Wraps react-chessboard to display a position and:
 *  - tints the from/to squares of the last played move with the move's
 *    classification color (heavier on the destination square)
 *  - stamps the classification badge on the destination square — prefers the
 *    dedicated PNG asset in `/badges`, falls back to a colored dot for
 *    classifications that ship no asset.
 *  - highlights hanging pieces (from the Rust analyzer) with a red inset ring
 *  - overlays a king-safety indicator on each king when analysis data exists
 */
"use client";

import { useMemo } from "react";
import { Chessboard } from "react-chessboard";
import type { SquareRenderer } from "react-chessboard";
import type { Square } from "chess.js";
import { customPieces } from "@/components/chess/customPieces";
import { boardTheme } from "@/components/chess/boardTheme";
import { classificationVisuals } from "@/components/review/classificationVisuals";
import type { PositionAnalysis } from "@/lib/chess/engine-rs/types";

interface ReviewBoardProps {
  fen: string;
  lastMove: { from: Square; to: Square } | null;
  classification?: string;
  positionAnalysis?: PositionAnalysis | null;
  /** Square → tint override from the heatmap panel (takes precedence). */
  heatmap?: Record<string, string> | null;
}

/** Hex → `rgba()` string so tints can reuse badge colors at reduced alpha. */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

// Badge PNGs shipped under /public/badges. Classifications without an entry
// here (great, forced, critical, theory, risky) use the dot fallback below.
const badgeImages: Record<string, string> = {
  brilliant: "/badges/brilliant.png",
  best: "/badges/best.png",
  excellent: "/badges/excellent.png",
  good: "/badges/good.png",
  book: "/badges/book.png",
  inaccuracy: "/badges/inaccuracy.png",
  mistake: "/badges/mistake.png",
  miss: "/badges/miss.png",
  blunder: "/badges/blunder.png",
  onlyMove: "/badges/onlyMove.png",
};

export function ReviewBoard({ fen, lastMove, classification, positionAnalysis, heatmap }: ReviewBoardProps) {
  const badgeSquare = lastMove && classification ? lastMove.to : null;

  // Hanging squares discovered by the Rust analyzer → red inset ring.
  const hangingSquares = useMemo(() => {
    if (!positionAnalysis) return [] as Square[];
    const white = (positionAnalysis.hangingWhite ?? []).map((h) => h.square);
    const black = (positionAnalysis.hangingBlack ?? []).map((h) => h.square);
    return [...new Set([...white, ...black])] as Square[];
  }, [positionAnalysis]);

  // King squares → safety score (0-9 derived from danger_score 0-1000).
  const kingSafety = useMemo(() => {
    if (!positionAnalysis) return {} as Record<string, { score: number; danger: number }>;
    const out: Record<string, { score: number; danger: number }> = {};
    const safety = positionAnalysis.kingSafety;
    if (!safety) return out;
    const addKing = (side: "white" | "black") => {
      const k = safety[side];
      if (!k || !k.king_square) return;
      const danger = k.danger_score ?? 0;
      const score = Math.round((1 - danger / 1000) * 9);
      out[k.king_square] = {
        score: Math.max(0, Math.min(9, score)),
        danger,
      };
    };
    addKing("white");
    addKing("black");
    return out;
  }, [positionAnalysis]);

  // Square tints are derived from the last move + its classification.
  const lastMoveSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (lastMove) {
      const tint = classification
        ? classificationVisuals[classification]?.badgeBg ?? "#ffd54f"
        : "#ffd54f";
      styles[lastMove.from] = {
        backgroundColor: hexToRgba(tint, 0.3),
      };
      styles[lastMove.to] = {
        backgroundColor: hexToRgba(tint, 0.5),
      };
    }
    return styles;
  }, [lastMove, classification]);

  function kingSafetyColor(score: number): string {
    if (score >= 7) return "#22c55e";
    if (score >= 4) return "#eab308";
    return "#ef4444";
  }

  const squareRenderer: SquareRenderer = ({ square, children }) => (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        // Heatmap tint wins over the last-move tint while the panel is open.
        ...(heatmap?.[square] ? { backgroundColor: heatmap[square] } : lastMoveSquareStyles[square]),
        boxShadow: hangingSquares.includes(square as Square)
          ? "inset 0 0 0 2px rgba(239, 68, 68, 0.55)"
          : undefined,
      }}
    >
      {children}
      {kingSafety[square as Square] && (
        <span
          title={`King safety: ${kingSafety[square as Square].danger} / 1000 danger`}
          className="absolute top-0.5 left-0.5 z-10 font-bold leading-none"
          style={{
            fontSize: "13px",
            color: kingSafetyColor(kingSafety[square as Square].score),
            textShadow: "0 0 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)",
          }}
        >
          {kingSafety[square as Square].score}
        </span>
      )}
      {square === badgeSquare && classification && (
        <>
          {badgeImages[classification] ? (
            <img
              src={badgeImages[classification]}
              alt={classification}
              title={classification}
              className="absolute top-0.5 right-0.5 z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
              style={{ width: "42%", height: "42%" }}
            />
          ) : (
            <span
              title={classification}
              className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full z-10 ring-2 ring-black/40"
              style={{
                backgroundColor:
                  classificationVisuals[classification]?.badgeBg ?? "#666",
              }}
            />
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black/20 border border-white/[0.06]">
      <Chessboard
        options={{
          id: "aura-review-board",
          position: fen,
          pieces: customPieces,
          boardOrientation: "white",
          boardStyle: { borderRadius: "0" },
          darkSquareStyle: { backgroundColor: boardTheme.darkSquare },
          lightSquareStyle: { backgroundColor: boardTheme.lightSquare },
          allowDragging: false,
          showAnimations: true,
          animationDurationInMs: 250,
          squareStyles: lastMoveSquareStyles,
          squareRenderer,
        }}
      />
    </div>
  );
}
/**
 * Review board with move annotations.
 *
 * Wraps react-chessboard to display a position and:
 *  - tints the from/to squares of the last played move with the move's
 *    classification color (heavier on the destination square)
 *  - stamps the classification badge on the destination square — prefers the
 *    dedicated PNG asset in `/badges`, falls back to a colored dot for
 *    classifications that ship no asset.
 */
"use client";

import { useMemo } from "react";
import { Chessboard } from "react-chessboard";
import type { SquareRenderer } from "react-chessboard";
import type { Square } from "chess.js";
import { customPieces } from "@/components/chess/customPieces";
import { boardTheme } from "@/components/chess/boardTheme";
import { classificationVisuals } from "@/components/review/classificationVisuals";

interface ReviewBoardProps {
  fen: string;
  lastMove: { from: Square; to: Square } | null;
  classification?: string;
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

export function ReviewBoard({ fen, lastMove, classification }: ReviewBoardProps) {
  const badgeSquare = lastMove && classification ? lastMove.to : null;

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

  const squareRenderer: SquareRenderer = ({ square, children }) => (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        ...lastMoveSquareStyles[square],
      }}
    >
      {children}
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
/**
 * Board look & feel for play AND review.
 *
 * `boardTheme` holds the raw colors; the two style helpers power the legal-move
 * and capture-square hints drawn by react-chessboard's `squareStyles`.
 */
import type React from 'react';

export const boardTheme = {
  lightSquare: '#e1e1e1',
  darkSquare: '#8A909A',
  legalMove: 'rgba(0, 0, 0, 0.32)',
  legalMoveDot: 'rgba(0, 0, 0, 0.35)',
} as const;

/** Empty-square legal-move hint: a centered filled dot. */
export const legalMoveSquareStyle: React.CSSProperties = {
  background: `radial-gradient(circle at center, ${boardTheme.legalMoveDot} 26%, transparent 26%)`,
};

/** Capture hint: an inset ring around the target square. */
export const captureSquareStyle: React.CSSProperties = {
  background: 'transparent',
  boxShadow: `inset 0 0 0 3px rgba(0,0,0,0.4)`,
};
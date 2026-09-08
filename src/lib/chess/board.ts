/**
 * Board-level tactical helpers.
 *
 * These operate on FEN strings (no React or engine dependency) so they can be
 * reused by the analyser, future play/puzzle features, or server-side code:
 *  - `getAttackers` / `getDefenders`  — who attacks/defends a square
 *  - `isPieceHanging`                 — is a piece capturable with material profit
 */
import { Chess, type Square } from "chess.js";

interface Coordinate {
  x: number;
  y: number;
}

export interface InfluencingPiece {
  square: Square;
  color: string;
  type: string;
}

// Promotion choices in chess.js move syntax (undefined = auto-queen).
export const promotions = [undefined, "b", "n", "r", "q"];

// Material values used by the hanging-piece heuristics.
export const pieceValues: { [key: string]: number } = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: Infinity,
  m: 0,
};

function getBoardCoordinates(square: Square): Coordinate {
  return {
    x: "abcdefgh".indexOf(square.slice(0, 1)),
    y: parseInt(square.slice(1), 10) - 1,
  };
}

function getSquare(coordinate: Coordinate): Square {
  return ("abcdefgh".charAt(coordinate.x) +
    (coordinate.y + 1).toString()) as Square;
}

function getDirection(
  from: Coordinate,
  to: Coordinate,
): { dx: number; dy: number } | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return null;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(Math.abs(dx), Math.abs(dy));
  return { dx: dx / g, dy: dy / g };
}

function findXrayAttackers(
  board: Chess,
  square: Square,
  attacker: InfluencingPiece,
  color: string,
): InfluencingPiece[] {
  const xrays: InfluencingPiece[] = [];
  const atkCoord = getBoardCoordinates(attacker.square);
  const targetCoord = getBoardCoordinates(square);
  const dir = getDirection(atkCoord, targetCoord);
  if (!dir) return xrays;

  let x = atkCoord.x - dir.dx;
  let y = atkCoord.y - dir.dy;
  while (x >= 0 && x <= 7 && y >= 0 && y <= 7) {
    const sq = getSquare({ x, y });
    const piece = board.get(sq);
    if (!piece) {
      x -= dir.dx;
      y -= dir.dy;
      continue;
    }
    if (piece.color !== color) break;
    const isSliding =
      piece.type === "q" ||
      (piece.type === "r" && dir.dx !== 0 && dir.dy === 0) ||
      (piece.type === "r" && dir.dx === 0 && dir.dy !== 0) ||
      (piece.type === "b" && dir.dx !== 0 && dir.dy !== 0);
    if (!isSliding) break;
    xrays.push({ square: sq, color: piece.color, type: piece.type });
    break;
  }
  return xrays;
}

/**
 * Which pieces of the opponent's color can currently capture `square`?
 * Implemented by flipping the side to move and enumerating pseudo-legal
 * captures of that square (chess.js `move({to: square})` acts as enemy-king
 * "glue"). Optional `xray` follows sliders through defended blocking pieces.
 *
 * Returns pieces relative to the piece currently ON `square` (i.e. the color
 * that attacks it), or empty when the square is empty.
 */
export function getAttackers(
  fen: string,
  square: Square,
  opts?: { xray?: boolean },
): InfluencingPiece[] {
  const attackers: InfluencingPiece[] = [];
  const board = new Chess(fen);
  const piece = board.get(square);
  if (!piece) return attackers;

  board.load(
    fen
      .replace(/(?<= )(?:w|b)(?= )/g, piece.color === "w" ? "b" : "w")
      .replace(/ [a-h][1-8] /g, " - "),
  );

  const legalMoves = board.moves({ verbose: true });

  for (const move of legalMoves) {
    if (move.to === square) {
      attackers.push({
        square: move.from,
        color: move.color,
        type: move.piece,
      });
    }
  }

  let oppositeKing: InfluencingPiece | undefined;
  const oppositeColour = piece.color === "w" ? "b" : "w";

  const pieceCoordinate = getBoardCoordinates(square);
  for (let xOffset = -1; xOffset <= 1; xOffset++) {
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
      if (xOffset === 0 && yOffset === 0) continue;

      const offsetSquare = getSquare({
        x: Math.min(Math.max(pieceCoordinate.x + xOffset, 0), 7),
        y: Math.min(Math.max(pieceCoordinate.y + yOffset, 0), 7),
      });
      const offsetPiece = board.get(offsetSquare);
      if (!offsetPiece) continue;

      if (offsetPiece.color === oppositeColour && offsetPiece.type === "k") {
        oppositeKing = {
          color: offsetPiece.color,
          square: offsetSquare,
          type: offsetPiece.type,
        };
        break;
      }
    }
    if (oppositeKing) break;
  }

  if (!oppositeKing) return attackers;

  let kingCaptureLegal = false;
  try {
    board.move({ from: oppositeKing.square, to: square });
    kingCaptureLegal = true;
  } catch {}

  if (oppositeKing && (attackers.length > 0 || kingCaptureLegal)) {
    attackers.push(oppositeKing);
  }

  if (opts?.xray) {
    const xrays: InfluencingPiece[] = [];
    for (const atk of attackers) {
      if (atk.type === "b" || atk.type === "r" || atk.type === "q") {
        xrays.push(...findXrayAttackers(board, square, atk, atk.color));
      }
    }
    for (const xr of xrays) {
      if (!attackers.some((a) => a.square === xr.square)) {
        attackers.push(xr);
      }
    }
  }

  return attackers;
}

/**
 * Pieces that currently protect `square` (opposite of `getAttackers`).
 * Internally it pretends an enemy attacker, then flips the side to move so the
 * defenders appear as "attackers" of the re-targeted square.
 */
export function getDefenders(
  fen: string,
  square: Square,
  opts?: { xray?: boolean },
) {
  const board = new Chess(fen);
  const piece = board.get(square);
  if (!piece) return [];
  const testAttacker = getAttackers(fen, square, opts)[0];

  if (testAttacker) {
    board.load(
      fen
        .replace(/(?<= )(?:w|b)(?= )/g, testAttacker.color)
        .replace(/ [a-h][1-8] /g, " - "),
    );

    for (const promotion of promotions) {
      try {
        board.move({
          from: testAttacker.square,
          to: square,
          promotion: promotion,
        });
        return getAttackers(board.fen(), square, opts);
      } catch {}
    }
  } else {
    board.load(
      fen
        .replace(/(?<= )(?:w|b)(?= )/g, piece.color)
        .replace(/ [a-h][1-8] /g, " - "),
    );

    board.put(
      {
        color: piece.color === "w" ? "b" : "w",
        type: "q",
      },
      square,
    );

    return getAttackers(board.fen(), square, opts);
  }

  return [];
}

/**
 * Heuristic: is the piece on `square` about to be lost for free?
 * Compares attackers vs. defenders using `pieceValues` and skips cases where a
 * capture wouldn't gain material (equal exchange, traded rooks, knight-for-knight,
 * or defended rook under attack by a single minor, ...).
 * Used to label "hanging pieces" missed by the engine review.
 */
export function isPieceHanging(lastFen: string, fen: string, square: Square) {
  const lastBoard = new Chess(lastFen);
  const board = new Chess(fen);

  const lastPiece = lastBoard.get(square);
  const piece = board.get(square);

  if (!piece) return false;

  const attackers = getAttackers(fen, square);
  const defenders = getDefenders(fen, square);

  if (
    lastPiece &&
    pieceValues[lastPiece.type] >= pieceValues[piece.type] &&
    lastPiece.color !== piece.color
  ) {
    return false;
  }

  if (
    piece.type === "r" &&
    lastPiece &&
    pieceValues[lastPiece.type] === 3 &&
    attackers.every((atk) => pieceValues[atk.type] === 3) &&
    attackers.length === 1
  ) {
    return false;
  }

  if (
    attackers.some((atk) => pieceValues[atk.type] < pieceValues[piece.type])
  ) {
    return true;
  }

  if (attackers.length > defenders.length) {
    let minAttackerValue = Infinity;
    for (const attacker of attackers) {
      minAttackerValue = Math.min(pieceValues[attacker.type], minAttackerValue);
    }

    if (
      pieceValues[piece.type] < minAttackerValue &&
      defenders.some((dfn) => pieceValues[dfn.type] < minAttackerValue)
    ) {
      return false;
    }

    if (defenders.some((dfn) => pieceValues[dfn.type] === 1)) {
      return false;
    }

    return true;
  }

  return false;
}

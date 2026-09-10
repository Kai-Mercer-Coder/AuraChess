/**
 * Post-processing layer that turns raw engine multi-PV evaluations into a
 * human-readable game review.
 *
 * `positions` are the game's positions in move order, each carrying the engine
 * top lines. This module:
 *   1. Compares the eval before/after each move (WPL) and assigns a
 *      classification (BEST, BRILLIANT, INACCURACY, BLUNDER, ...).
 *   2. Runs a brute-force "brilliant" heuristic: a winning move that hangs a
 *      piece but cannot actually be refuted by capture.
 *   3. Tags opening moves using the ECO openings DB and flags "BOOK" moves.
 *   4. Aggregates per-side accuracy percentages and classification counts.
 */
import { Chess, Square } from "chess.js";
import { findOpening } from "@chess-openings/eco.json";

import { EvaluatedPosition } from "../types/Position";
import Report from "../types/Report";

import {
  Classification,
  classificationValues,
  computeWPL,
  isMiss,
  wplClassify,
} from "./classification";
import {
  InfluencingPiece,
  getAttackers,
  isPieceHanging,
  pieceValues,
  promotions,
} from "./board";

export async function analyse(positions: EvaluatedPosition[]): Promise<Report> {
  const openingsDB = await getOpeningsDB();

  let lastWPL: number | undefined;
  let positionIndex = 0;

  // NOTE: we iterate over `positions.slice(1)` — position[0] is the starting
  // position and has no preceding move; each `position` inspected below is the
  // position AFTER the move we are actually classifying.
  for (let position of positions.slice(1)) {
    positionIndex++;

    let board = new Chess(position.fen);
    let lastPosition = positions[positionIndex - 1];

    let topMove = lastPosition.topLines.find((line) => line.id == 1);
    let secondTopMove = lastPosition.topLines.find((line) => line.id == 2);
    if (!topMove) continue;

    let previousEvaluation = topMove.evaluation;
    let evaluation = position.topLines.find((line) => line.id == 1)?.evaluation;
    if (!previousEvaluation) continue;

    // Whose move led to this position? A " b " FEN means black just moved.
    let moveColour = (position.fen.includes(" b ") ? "white" : "black") as "white" | "black";

    if (!evaluation) {
      evaluation = { type: board.isCheckmate() ? "mate" : "cp", value: 0 };
      position.topLines.push({
        id: 1,
        depth: 0,
        evaluation: evaluation,
        moveUCI: "",
      });
    }

    let absoluteEvaluation =
      evaluation.value * (moveColour == "white" ? 1 : -1);
    let previousAbsoluteEvaluation =
      previousEvaluation.value * (moveColour == "white" ? 1 : -1);
    let absoluteSecondEvaluation =
      (secondTopMove?.evaluation.value ?? 0) * (moveColour == "white" ? 1 : -1);

    let wpl = computeWPL(
      previousEvaluation.value, previousEvaluation.type == "mate",
      evaluation.value, evaluation.type == "mate",
      moveColour,
    );

    // Persist per-move WPL for the continuous accuracy curve below. Stored
    // before any `continue` so forced moves count with their (near-zero) WPL.
    position.wpl = wpl;

    if (!secondTopMove) {
      const legalMoves = board.moves();
      if (legalMoves.length <= 1) {
        // Only one legal move → the move was forced, no quality judgement.
        position.classification = Classification.FORCED;
        continue;
      }
      // Fallback: only one engine line was produced; synthesize a second line
      // equal to the first so the best-move comparison below still works.
      secondTopMove = {
        id: 2,
        depth: topMove.depth,
        evaluation: { ...topMove.evaluation },
        moveUCI: topMove.moveUCI,
        moveSAN: topMove.moveSAN,
      };
    }

    let noMate = previousEvaluation.type == "cp" && evaluation.type == "cp";

    // --- Main classification ladder ---------------------------------
    if (topMove.moveUCI == position.move.uci) {
      // The engine's preferred move was played.
      position.classification = Classification.BEST;
    } else {
      if (noMate) {
        position.classification = wplClassify(wpl);
      } else if (previousEvaluation.type == "cp" && evaluation.type == "mate") {
        if (absoluteEvaluation > 0) {
          position.classification = Classification.BEST;
        } else if (absoluteEvaluation >= -2) {
          position.classification = Classification.BLUNDER;
        } else if (absoluteEvaluation >= -5) {
          position.classification = Classification.MISTAKE;
        } else {
          position.classification = Classification.INACCURACY;
        }
      } else if (previousEvaluation.type == "mate" && evaluation.type == "cp") {
        if (previousAbsoluteEvaluation < 0 && absoluteEvaluation < 0) {
          position.classification = Classification.BEST;
        } else if (absoluteEvaluation >= 400) {
          position.classification = Classification.GOOD;
        } else if (absoluteEvaluation >= 150) {
          position.classification = Classification.INACCURACY;
        } else if (absoluteEvaluation >= -100) {
          position.classification = Classification.MISTAKE;
        } else {
          position.classification = Classification.BLUNDER;
        }
      } else if (
        previousEvaluation.type == "mate" &&
        evaluation.type == "mate"
      ) {
        if (previousAbsoluteEvaluation > 0) {
          if (absoluteEvaluation <= -4) {
            position.classification = Classification.MISTAKE;
          } else if (absoluteEvaluation < 0) {
            position.classification = Classification.BLUNDER;
          } else if (absoluteEvaluation < previousAbsoluteEvaluation) {
            position.classification = Classification.BEST;
          } else if (absoluteEvaluation <= previousAbsoluteEvaluation + 2) {
            position.classification = Classification.EXCELLENT;
          } else {
            position.classification = Classification.GOOD;
          }
        } else {
          if (absoluteEvaluation == previousAbsoluteEvaluation) {
            position.classification = Classification.BEST;
          } else {
            position.classification = Classification.GOOD;
          }
        }
      }
    }

    if (position.classification !== Classification.BEST) {
      if (isMiss(lastWPL, wpl)) {
        // Opponent blundered and we failed to exploit → "miss".
        position.classification = Classification.MISS;
      }
    }
    lastWPL = wpl;

    if (position.classification == Classification.BEST) {
      let winningAnyways =
        (absoluteSecondEvaluation >= 700 && topMove.evaluation.type == "cp") ||
        (topMove.evaluation.type == "mate" &&
          secondTopMove.evaluation.type == "mate");

      // --- "Brilliant" heuristic -------------------------------------
      // A best (non-capturing) move that leaves one of our own pieces hanging
      // on a QUIET square, where that piece cannot actually be captured profit:
      // walk every capture of the sacrificed piece; if some enemy piece itself
      // becomes capturable afterward (pin/knight-fork style), the sacrifice
      // holds and the move is called BRILLIANT.
      if (
        absoluteEvaluation >= 0 &&
        !winningAnyways &&
        !position.move.san.includes("=")
      ) {
        let lastBoard = new Chess(lastPosition.fen);
        let currentBoard = new Chess(position.fen);
        if (lastBoard.isCheck()) continue;

        let lastPiece = lastBoard.get(
          position.move.uci.slice(2, 4) as Square,
        ) || { type: "m" };

        let sacrificedPieces: InfluencingPiece[] = [];
        for (let row of currentBoard.board()) {
          for (let piece of row) {
            if (!piece) continue;
            if (piece.color != moveColour.charAt(0)) continue;
            if (piece.type == "k" || piece.type == "p") continue;

            if (pieceValues[lastPiece.type] >= pieceValues[piece.type]) {
              continue;
            }

            if (isPieceHanging(lastPosition.fen, position.fen, piece.square)) {
              position.classification = Classification.BRILLIANT;
              sacrificedPieces.push(piece);
            }
          }
        }

        let anyPieceViablyCapturable = false;
        let captureTestBoard = new Chess(position.fen);

        for (let piece of sacrificedPieces) {
          let attackers = getAttackers(position.fen, piece.square);

          for (let attacker of attackers) {
            for (let promotion of promotions) {
              try {
                captureTestBoard.move({
                  from: attacker.square,
                  to: piece.square,
                  promotion: promotion,
                });

                let attackerPinned = false;
                for (let row of captureTestBoard.board()) {
                  for (let enemyPiece of row) {
                    if (!enemyPiece) continue;
                    if (enemyPiece.color == captureTestBoard.turn()) continue;
                    if (enemyPiece.type == "k" || enemyPiece.type == "p")
                      continue;

                    if (
                      isPieceHanging(
                        position.fen,
                        captureTestBoard.fen(),
                        enemyPiece.square,
                      ) &&
                      pieceValues[enemyPiece.type] >=
                        Math.max(
                          ...sacrificedPieces.map(
                            (sack) => pieceValues[sack.type],
                          ),
                        )
                    ) {
                      attackerPinned = true;
                      break;
                    }
                  }
                  if (attackerPinned) break;
                }

                if (pieceValues[piece.type] >= 5) {
                  if (!attackerPinned) {
                    anyPieceViablyCapturable = true;
                    break;
                  }
                } else if (
                  !attackerPinned &&
                  !captureTestBoard.moves().some((move) => move.endsWith("#"))
                ) {
                  anyPieceViablyCapturable = true;
                  break;
                }

                captureTestBoard.undo();
              } catch {}
            }

            if (anyPieceViablyCapturable) break;
          }

          if (anyPieceViablyCapturable) break;
        }

        if (!anyPieceViablyCapturable) {
          position.classification = Classification.BEST;
        }
      }

      try {
        // --- "Great" heuristic ----------------------------------------
        // If the previous move was a BLUNDER (≥150cp swing to second line) and
        // we play the best move exploiting it without a hanging piece → GREAT.
        if (
          noMate &&
          position.classification != Classification.BRILLIANT &&
          lastPosition.classification == Classification.BLUNDER &&
          Math.abs(topMove.evaluation.value - secondTopMove.evaluation.value) >=
            150 &&
          !isPieceHanging(
            lastPosition.fen,
            position.fen,
            position.move.uci.slice(2, 4) as Square,
          )
        ) {
          position.classification = Classification.GREAT;
        }
      } catch {}
    }

    if (
      position.classification == Classification.BLUNDER &&
      absoluteEvaluation >= 600
    ) {
      position.classification = Classification.GOOD;
    }

    if (
      position.classification == Classification.BLUNDER &&
      previousAbsoluteEvaluation <= -600 &&
      previousEvaluation.type == "cp" &&
      evaluation.type == "cp"
    ) {
      position.classification = Classification.GOOD;
    }

    position.classification ??= Classification.BOOK;
  }

  // --- Opening detection ---------------------------------------------
  // Tag the first positions with an ECO opening name when the FEN matches the
  // book (stops once a position is out of theory).
  const maxOpeningHalfMoves = 20;
  for (let i = 0; i < Math.min(positions.length, maxOpeningHalfMoves); i++) {
    const position = positions[i];
    if (openingsDB) {
      const opening = findOpening(openingsDB, position.fen);
      position.opening = opening?.name;
    }
  }

  let positiveClassifs = Object.keys(classificationValues).slice(4, 8);
  // Short "theory/cloud" window: cloud-analyzed moves and known-opening moves
  // near the start are demoted to BOOK; the run stops at the first non-book move.
  for (let i = 0; i < positions.length - 1; i++) {
    const position = positions[i + 1];
    if (i >= maxOpeningHalfMoves) break;
    if (
      (position.worker == "cloud" &&
        positiveClassifs.includes(position.classification!)) ||
      position.opening
    ) {
      position.classification = Classification.BOOK;
    } else {
      break;
    }
  }

  // --- SAN naming ---------------------------------------------------
  // Convert raw UCI moves of the engine lines into readable SAN strings.
  for (let position of positions) {
    for (let line of position.topLines) {
      if (line.evaluation.type == "mate" && line.evaluation.value == 0)
        continue;

      let board = new Chess(position.fen);

      try {
        line.moveSAN = board.move({
          from: line.moveUCI.slice(0, 2),
          to: line.moveUCI.slice(2, 4),
          promotion: line.moveUCI.slice(4) || undefined,
        }).san;
      } catch {
        line.moveSAN = "";
      }
    }
  }

  // --- Accuracy + classification counts ---------------------------
  // Accuracy uses the chess.com-style continuous curve over average win
  // probability lost (WPL in win-% points), so similar play across games
  // scores continuously instead of jumping per label. A move only counts
  // toward `maximum` when it has a known classification.
  let accuracies = {
    white: { current: 0, maximum: 0, wplSum: 0, wplCount: 0 },
    black: { current: 0, maximum: 0, wplSum: 0, wplCount: 0 },
  };
  const classifications = {
    white: {
      brilliant: 0,
      great: 0,
      best: 0,
      excellent: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
      book: 0,
      forced: 0,
      miss: 0,
      critical: 0,
      theory: 0,
      risky: 0,
    },
    black: {
      brilliant: 0,
      great: 0,
      best: 0,
      excellent: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
      book: 0,
      forced: 0,
      miss: 0,
      critical: 0,
      theory: 0,
      risky: 0,
    },
  };

  for (let position of positions.slice(1)) {
    const moveColour = position.fen.includes(" b ") ? "white" : "black";

    const cls = position.classification!;
    accuracies[moveColour].current +=
      classificationValues[cls as keyof typeof classificationValues];
    accuracies[moveColour].maximum++;

    if (position.wpl != null) {
      accuracies[moveColour].wplSum += position.wpl * 100;
      accuracies[moveColour].wplCount++;
    }

    classifications[moveColour][cls as keyof typeof classifications.white] += 1;
  }

  return {
    accuracies: {
      white: continuousAccuracy(accuracies.white),
      black: continuousAccuracy(accuracies.black),
    },
    classifications,
    positions: positions,
  };
}

/**
 * Chess.com-style accuracy from average win probability lost (0..100 win-%
 * points). Falls back to the legacy per-classification mean when no WPL data
 * was recorded for the side.
 */
function continuousAccuracy(side: {
  current: number;
  maximum: number;
  wplSum: number;
  wplCount: number;
}): number {
  if (side.wplCount > 0) {
    const avgWpl = side.wplSum / side.wplCount;
    return Math.min(100, Math.max(0, 103.1668 * Math.exp(-0.04354 * avgWpl) - 3.1669));
  }
  return side.maximum > 0 ? (side.current / side.maximum) * 100 : 0;
}

// Cached dynamic import of the ECO openings book (loaded once per browser).
let openingsDBPromise: Promise<any> | null = null;
function getOpeningsDB() {
  if (!openingsDBPromise) {
    openingsDBPromise = import("@chess-openings/eco.json").then((mod) =>
      mod.openingBook(),
    );
  }
  return openingsDBPromise;
}

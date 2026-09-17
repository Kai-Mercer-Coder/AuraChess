/**
 * Named coach conditions — the vocabulary rules.ts uses in `when`.
 *
 * Every condition is a pure boolean over `CoachContext`. Names are grouped by
 * source: Rust WASM tactics, engine eval, move classification, mate distance,
 * phase (with OM/ME transitions), and move-number / game-length helpers.
 */
import type { CoachContext, PhaseId } from "./types";

/** Thresholds in centipawns, from the player's perspective. */
const MATE_CP = 10_000;
const WINNING_CP = 300;
const ADVANTAGE_CP = 150;
const SLIGHT_CP = 50;

/** Tactical motif keywords looked up in the Rust themes (fork, skewer, ...). */
const MOTIF_KEYS: Record<string, string[]> = {
  fork: ["fork"],
  skewer: ["skewer"],
  pinned: ["pin"],
  discovered: ["discover", "discovered"],
  backrank: ["back rank", "back-rank", "rook on back"],
  matethreat: ["mate threat", "mate in", "checkmate", "mating"],
  trapped: ["trapp", "trapped"],
};

function motifHit(
  ctx: CoachContext,
  key: string,
  side: "player" | "foe",
): boolean {
  const blob = ctx.blob;
  if (!blob?.themes?.length) return false;
  const sidePrefix = ctx[side] === "white" ? "w" : "b";
  const keys = MOTIF_KEYS[key];
  return blob.themes.some((t) => {
    const hay = `${t.id ?? ""} ${t.description ?? ""}`.toLowerCase();
    const ts = (t.side || "").toLowerCase();
    const forSide =
      ts === "both" ||
      ts === "either" ||
      ts === ctx[side].toLowerCase() ||
      ts.startsWith(sidePrefix);
    return forSide && keys.some((k) => hay.includes(k));
  });
}

function ownStructures(ctx: CoachContext, field: "passed" | "isolated" | "holes") {
  return ctx.blob?.pawn_structure?.[ctx.player]?.[field] ?? [];
}

/** Phase derived from the moving side's view of game stage. */
function phaseOf(ctx: CoachContext): PhaseId {
  return ctx.phase;
}

function evalSwingFiend(ctx: CoachContext, atLeast: number): boolean {
  return ctx.swingCp >= atLeast;
}

/** Own king danger score from the Rust king safety analysis. */
function ownKingDanger(ctx: CoachContext): number {
  return ctx.blob?.king_safety?.[ctx.player]?.danger_score ?? 0;
}

/** Opponent king danger score. */
function foeKingDanger(ctx: CoachContext): number {
  return ctx.blob?.king_safety?.[ctx.foe]?.danger_score ?? 0;
}

export const CONDITIONS: Record<string, (ctx: CoachContext) => boolean> = {
  // --- Rust WASM tactics (mover's ideas) -------------------------------
  isFork: (c) => motifHit(c, "fork", "player"),
  isSkewer: (c) => motifHit(c, "skewer", "player"),
  isPin: (c) => motifHit(c, "pinned", "player"),
  isDiscoveredAttack: (c) => motifHit(c, "discovered", "player"),
  isBackRankThreat: (c) => motifHit(c, "backrank", "player"),
  isMateThreat: (c) => motifHit(c, "matethreat", "player"),
  isTrappedPiece: (c) => motifHit(c, "trapped", "player"),
  isHangingPiece: (c) => ownHang(c).length > 0 || ownHang(c).some((h) => h.loss_cp >= 100),

  // --- Rust WASM tactics (opponent's ideas / threats to us) -------------
  isOpponentFork: (c) => motifHit(c, "fork", "foe"),
  isOpponentSkewer: (c) => motifHit(c, "skewer", "foe"),
  isOpponentPin: (c) => motifHit(c, "pinned", "foe"),
  isOpponentDiscoveredAttack: (c) => motifHit(c, "discovered", "foe"),
  isOpponentBackRankThreat: (c) => motifHit(c, "backrank", "foe"),
  isOpponentMateThreat: (c) => motifHit(c, "matethreat", "foe"),
  isOpponentTrappedPiece: (c) => motifHit(c, "trapped", "foe"),
  isOpponentHangingPiece: (c) => foeHang(c).length > 0,

  // --- Engine eval (player perspective, centipawns) ---------------------
  winning: (c) => c.mate.playerIn !== null || c.evalCp >= WINNING_CP,
  highAdvantage: (c) => c.evalCp >= ADVANTAGE_CP,
  slightAdvantage: (c) => c.evalCp >= SLIGHT_CP,
  equal: (c) => Math.abs(c.evalCp) < SLIGHT_CP,
  slightDisadvantage: (c) => c.evalCp <= -SLIGHT_CP,
  losing: (c) => c.mate.opponentIn !== null || c.evalCp <= -WINNING_CP,
  mateish: (c) => Math.abs(c.evalCp) >= MATE_CP,
  missedTactic: (c) => c.swingCp >= 80,
  evalSwingBig: (c) => evalSwingFiend(c, 200),
  evalSwingSmall: (c) => evalSwingFiend(c, 40) && !evalSwingFiend(c, 200),

  // --- Move classification ---------------------------------------------
  isBlunder: (c) => c.classification === "blunder",
  isMistake: (c) => c.classification === "mistake",
  isMiss: (c) => c.classification === "miss",
  isInaccuracy: (c) => c.classification === "inaccuracy",
  isGood: (c) => c.classification === "good",
  isGreat: (c) => c.classification === "great",
  isExcellent: (c) => c.classification === "excellent",
  isBest: (c) => c.classification === "best",
  isBrilliant: (c) => c.classification === "brilliant",
  isBook: (c) => c.classification === "book",
  isForced: (c) => c.classification === "forced",
  isCritical: (c) => c.classification === "critical",
  isTheory: (c) => c.classification === "theory",
  isRisky: (c) => c.classification === "risky", // keeps classification ladder

  // --- Mate distance (full moves) --------------------------------------
  isMateIn1: (c) => c.mate.playerIn === 1,
  isMateIn2: (c) => c.mate.playerIn === 2,
  isMateIn3: (c) => c.mate.playerIn === 3,
  isOpponentMateIn1: (c) => c.mate.opponentIn === 1,
  isOpponentMateIn2: (c) => c.mate.opponentIn === 2,
  isOpponentMateIn3: (c) => c.mate.opponentIn === 3,
  deliveredMate: (c) => c.san.endsWith("#"),
  deliveredCheck: (c) => c.san.endsWith("+") || c.san.endsWith("#"),

  // --- Phase + transition windows ---------------------------------------
  isOpening: (c) => phaseOf(c) === "opening",
  isOM: (c) => phaseOf(c) === "om",
  isMiddlegame: (c) => phaseOf(c) === "middlegame",
  isME: (c) => phaseOf(c) === "me",
  isEndgame: (c) => phaseOf(c) === "endgame",

  // --- Move number / game length ---------------------------------------
  moveBelow10: (c) => c.moveNumber < 10,
  moveBelow15: (c) => c.moveNumber < 15,
  moveBelow20: (c) => c.moveNumber < 20,
  moveAbove30: (c) => c.moveNumber > 30,
  moveAbove40: (c) => c.moveNumber > 40,
  moveAbove50: (c) => c.moveNumber > 50,
  isNearEndOfGame: (c) => c.moveNumber + 10 > c.maxMove,
  isShortGame: (c) => c.maxMove < 30,
  isLongGame: (c) => c.maxMove > 60,

  // --- King safety ------------------------------------------------------
  kingDanger: (c) => ownKingDanger(c) >= 600,
  opponentKingDanger: (c) => foeKingDanger(c) >= 600,
  kingUncastled: (c) => !c.blob?.king_safety?.[c.player]?.castled,

  // --- Pawn structure ----------------------------------------------------
  hasPassedPawn: (c) => ownStructures(c, "passed").length > 0,
  hasIsolatedPawn: (c) => ownStructures(c, "isolated").length > 0,
  hasHangingPawns: (c) =>
    !!c.blob?.pawn_structure?.[c.player === "white" ? "hanging_pawns_white" : "hanging_pawns_black"],
  hasIQP: (c) =>
    !!(c.player === "white"
      ? c.blob?.pawn_structure?.iqp_white
      : c.blob?.pawn_structure?.iqp_black),

  // --- Material -----------------------------------------------------------
  hasBishopPair: (c) =>
    !!(c.player === "white"
      ? c.blob?.material?.bishop_pair_white
      : c.blob?.material?.bishop_pair_black),
  materialUp: (c) => {
    const delta = c.blob?.material?.material_delta_cp ?? 0;
    const mine = c.player === "white" ? delta : -delta;
    return mine > 0;
  },
  materialDown: (c) => {
    const delta = c.blob?.material?.material_delta_cp ?? 0;
    const mine = c.player === "white" ? delta : -delta;
    return mine < 0;
  },

  // --- Positional ---------------------------------------------------------
  hasOutpost: (c) => (c.blob?.activity?.[c.player]?.outposts?.length ?? 0) > 0,
  badBishop: (c) => !!c.blob?.activity?.[c.player]?.bad_bishop,

  // --- Played-move quality -----------------------------------------------
  playedBest: (c) => c.playedBest,
  playedCapture: (c) => c.san.includes("x"),
  playedPiece: (c) => /[NBRQK]/.test(c.san), // non-pawn move
  playedPawnPush: (c) => /^[a-h]/.test(c.san), // pawn move without capture
};

/** Number of player's own hanging pieces. */
function ownHang(ctx: CoachContext) {
  return ctx.player === "white" ? ctx.pa?.hangingWhite ?? [] : ctx.pa?.hangingBlack ?? [];
}

/** Number of opponent's hanging pieces. */
function foeHang(ctx: CoachContext) {
  return ctx.player === "white" ? ctx.pa?.hangingBlack ?? [] : ctx.pa?.hangingWhite ?? [];
}
/**
 * Coach rule engine.
 *
 * Builds a `CoachContext` from the current position (plus the previous one,
 * seed, and game metadata), then walks `RULES` in order and returns the first
 * rule whose `when` conditions and optional `check` all match — with one text
 * picked deterministically per (game, move) so it never flickers while
 * navigating.
 */
import type { Classification } from "@/lib/types/Classification";
import type { EvaluatedPosition } from "@/lib/types/Position";
import { CONDITIONS } from "./conditions";
import { RULES } from "./rules";
import type { CoachContext, CoachMessage, CoachRule, PhaseId } from "./types";

export interface CoachOptions {
  /** Random seed rolled once per game load — makes picks stable inside a game. */
  seed?: number;
  /** Number of moves played so far (plies), i.e. the display nav index. */
  moveNo?: number;
  /** Total moves in the game (plies). */
  maxMove?: number;
}

/** Mate eval values are stored in full moves (Stockfish UCI, White-relative). */
const MATE_NONE_CP = 10_000;

function sideToMove(fen: string): "white" | "black" {
  return fen.includes(" b ") ? "black" : "white";
}

function normalizeMate(raw: number): number {
  return Math.abs(raw);
}

function mateInfoFor(ctx: Pick<CoachContext, "player" | "foe"> & {
  mateValue: number;
}): CoachContext["mate"] {
  const raw = ctx.mateValue;
  if (raw === 0) return { playerIn: null, opponentIn: null };
  const moves = normalizeMate(raw);
  const whiteMates = raw > 0;
  const playerMates = ctx.player === "white" ? whiteMates : !whiteMates;
  return playerMates
    ? { playerIn: moves, opponentIn: null }
    : { playerIn: null, opponentIn: moves };
}

function inferPhase(ctx: { moveNumber: number; blob?: CoachContext["blob"] }): PhaseId {
  const blob = ctx.blob;
  const rustPhase = (blob?.phase || "").toLowerCase();
  if (rustPhase.includes("end") || blob?.endgame?.is_endgame) return "endgame";
  if (rustPhase.includes("mid")) {
    // Midgame spans a wide band; blend in the ME tail window.
    if (ctx.moveNumber > 40 && ctx.moveNumber <= 52) return "me";
    return "middlegame";
  }
  if (rustPhase.includes("open")) {
    if (ctx.moveNumber > 10 && ctx.moveNumber <= 20) return "om";
    return "opening";
  }
  // Rust phase absent → fall back to pure move-number windows.
  if (ctx.moveNumber <= 11) return "opening";
  if (ctx.moveNumber <= 20) return "om";
  if (ctx.moveNumber <= 41) return "middlegame";
  if (ctx.moveNumber <= 52) return "me";
  return "endgame";
}

function defaultTone(classification?: Classification): CoachMessage["tone"] {
  switch (classification) {
    case "blunder":
    case "miss":
      return "bad";
    case "mistake":
    case "inaccuracy":
    case "critical":
    case "risky":
      return "warn";
    case "brilliant":
    case "great":
    case "best":
    case "excellent":
    case "good":
    case "book":
      return "good";
    default:
      return "info";
  }
}

/** Stable per-game hash → index into a rule's text array. */
function pickText(rule: CoachRule, ctx: CoachContext, seed: number): string {
  const corpus = `${seed}|${rule.id}|${ctx.moveNumber}|${ctx.san}`;
  let h = 0;
  for (let i = 0; i < corpus.length; i++) {
    h = (h * 31 + corpus.charCodeAt(i)) >>> 0;
  }
  return rule.text[h % rule.text.length];
}

/** Strip +/#/!/? suffixes so `Nf3+` matches best-move `Nf3`. */
function stripSuffix(san: string): string {
  return san.replace(/[+#?!]+$/, "");
}

function buildContext(
  position: EvaluatedPosition,
  previous: EvaluatedPosition | null,
  opts: CoachOptions,
): CoachContext | null {
  const san = position.move?.san;
  if (!san) return null;

  const player = sideToMove(position.fen) === "white" ? "black" : "white";
  const foe = player === "white" ? "black" : "white";
  const moveNumber = Math.ceil((opts.moveNo || 0) / 2);
  const maxMove = Math.ceil((opts.maxMove || 0) / 2);

  const topEval = position.topLines[0]?.evaluation;
  const prevLine = previous?.topLines?.[0];

  const toContextEval = (ev: { type: string; value: number } | undefined) => {
    if (!ev) return 0;
    if (ev.type === "mate") {
      const moves = normalizeMate(ev.value);
      return ev.value > 0 === (player === "white")
        ? MATE_NONE_CP
        : -MATE_NONE_CP;
    }
    return player === "white" ? ev.value : -ev.value;
  };

  const evalCp = toContextEval(topEval);
  const prevEvalCp = toContextEval(prevLine?.evaluation);
  const blob = position.positionAnalysis?.explanation ?? undefined;
  const pa = position.positionAnalysis;

  const prevBestSan = prevLine?.moveSAN ?? null;
  const playedBest =
    prevBestSan != null && stripSuffix(prevBestSan) === stripSuffix(san);

  const mateRaw = topEval?.type === "mate" ? topEval.value : 0;

  const ctx: CoachContext = {
    position,
    previousPosition: previous,
    player,
    foe,
    san,
    classification: position.classification,
    moveNumber,
    maxMove,
    phase: inferPhase({ moveNumber, blob }),
    evalCp,
    evalPawns: evalCp / 100,
    prevEvalCp,
    swingCp: prevEvalCp - evalCp,
    mate: mateInfoFor({ player, foe, mateValue: mateRaw }),
    prevBestSan,
    playedBest,
    blob,
    pa,
  };
  return ctx;
}

/**
 * One coach message for the given position (the move just played). Returns
 * null for the starting position or before analysis exists.
 */
export function getCoachMessage(
  position?: EvaluatedPosition | null,
  previous?: EvaluatedPosition | null,
  opts?: CoachOptions,
): CoachMessage | null {
  if (!position) return null;
  const ctx = buildContext(position, previous ?? null, opts ?? {});
  if (!ctx) return null;

  const seed = opts?.seed ?? 0;
  for (const rule of RULES) {
    if (rule.when) {
      let ok = true;
      for (const [name, expected] of Object.entries(rule.when)) {
        const evalCond = CONDITIONS[name];
        if (!evalCond) continue;
        if (!!evalCond(ctx) !== !!expected) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
    }
    if (rule.check && !rule.check(ctx)) continue;
    return {
      id: rule.id,
      tone: rule.tone ?? defaultTone(ctx.classification),
      text: pickText(rule, ctx, seed),
    };
  }

  // Should never reach here (last rule has no conditions); safety net.
  return {
    id: "fallback",
    tone: "info",
    text: `"${ctx.san}" played — nothing major to report.`,
  };
}
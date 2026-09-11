/**
 * Hardcoded coach rules (basic v1).
 *
 * Turns the current position's Rust analysis + move classification into a
 * short list of plain-language tips. Priority-ordered, capped at 4:
 * immediate tactics (hanging, pins, motifs) → king safety → structure and
 * material → activity → feedback on the move just played. Everything is
 * phrased from the side to move's perspective ("your"/"their").
 */
import type { EvaluatedPosition } from "@/lib/types/Position";

export type CoachTone = "good" | "warn" | "bad" | "info";

export interface CoachMessage {
  id: string;
  tone: CoachTone;
  text: string;
}

const MAX_MESSAGES = 4;

function prettyRole(role: string): string {
  const r = role.toLowerCase();
  return r.charAt(0).toUpperCase() + r.slice(1);
}

/** Piece color on `square` from the FEN placement field (for pin ownership). */
function pieceColorAt(fen: string, square: string): "white" | "black" | null {
  const file = "abcdefgh".indexOf(square[0]?.toLowerCase());
  const rank = parseInt(square[1], 10);
  if (file < 0 || !(rank >= 1 && rank <= 8)) return null;
  let r = 8;
  let f = 0;
  for (const ch of fen.split(" ")[0]) {
    if (ch === "/") {
      r--;
      f = 0;
      continue;
    }
    if (/\d/.test(ch)) {
      f += parseInt(ch, 10);
      continue;
    }
    if (r === rank && f === file) return ch === ch.toUpperCase() ? "white" : "black";
    f++;
  }
  return null;
}

/** Tactical motif scan over theme id + description (ids vary, so keywords). */
const MOTIFS: { key: string; noun: string }[] = [
  { key: "fork", noun: "fork" },
  { key: "skewer", noun: "skewer" },
  { key: "discover", noun: "discovered attack" },
  { key: "double check", noun: "double check" },
  { key: "batter", noun: "battery" },
  { key: "back rank", noun: "back-rank idea" },
  { key: "trapp", noun: "trapped piece" },
  { key: "checkmate", noun: "mating idea" },
  { key: "mate threat", noun: "mate threat" },
  { key: "mate in", noun: "mating net" },
];

export function getCoachMessages(pos?: EvaluatedPosition | null): CoachMessage[] {
  const out: CoachMessage[] = [];
  const blob = pos?.positionAnalysis?.explanation;
  if (!blob || !pos) return out;

  const mover = blob.side_to_move?.toLowerCase().startsWith("w") ? "white" : "black";
  const foe = mover === "white" ? "black" : "white";
  const pa = pos.positionAnalysis!;
  const phase = (blob.phase || "").toLowerCase();
  const moveNo = blob.move_number ?? 0;

  const ownHanging = mover === "white" ? (pa.hangingWhite ?? []) : (pa.hangingBlack ?? []);
  const foeHanging = mover === "white" ? (pa.hangingBlack ?? []) : (pa.hangingWhite ?? []);
  const ownKing = pa.kingSafety?.[mover];
  const foeKing = pa.kingSafety?.[foe];

  // --- Immediate tactics: hanging pieces -------------------------------
  for (const h of ownHanging.slice(0, 2)) {
    out.push({
      id: `hang-own-${h.square}`,
      tone: "bad",
      text: `Your ${prettyRole(h.role)} on ${h.square} is hanging (−${(h.loss_cp / 100).toFixed(1)}). Move it or defend it.`,
    });
  }
  for (const h of foeHanging.slice(0, 2)) {
    out.push({
      id: `hang-foe-${h.square}`,
      tone: "good",
      text: `Their ${prettyRole(h.role)} on ${h.square} is en prise — can you take it?`,
    });
  }

  // --- Pins (ownership read off the board) ------------------------------
  for (const p of blob.tactics?.pinned_pieces ?? []) {
    const owner = pieceColorAt(pos.fen, p.square);
    if (!owner) continue;
    const mine = owner === mover;
    out.push({
      id: `pin-${p.square}`,
      tone: mine ? "warn" : "good",
      text: mine
        ? `Your ${prettyRole(p.role)} on ${p.square} is pinned to your ${prettyRole(p.pinned_to_role)}${p.absolute ? " — it cannot move at all" : " — moving it loses material"}.`
        : `Their ${prettyRole(p.role)} on ${p.square} is pinned to their ${prettyRole(p.pinned_to_role)} — pile pressure on it.`,
    });
    if (out.length >= 6) break;
  }

  // --- Motif scan ---------------------------------------------------------
  const seenMotifs = new Set<string>();
  for (const t of blob.themes ?? []) {
    const hay = `${t.id ?? ""} ${t.description ?? ""}`.toLowerCase();
    const hit = MOTIFS.find((m) => hay.includes(m.key));
    if (!hit || seenMotifs.has(hit.key)) continue;
    seenMotifs.add(hit.key);
    const ts = (t.side || "").toLowerCase();
    const mine = ts.startsWith(mover[0]) || ts === "both" || ts === "either" || ts === "";
    const short = (t.description || hit.noun).slice(0, 90);
    out.push({
      id: `motif-${hit.key}-${ts || "x"}`,
      tone: mine ? "good" : "warn",
      text: mine ? `Sharp ${hit.noun} idea for you: ${short}.` : `Watch out — ${hit.noun} brewing against you: ${short}.`,
    });
    if (seenMotifs.size >= 2) break;
  }

  // --- King safety ----------------------------------------------------------
  if (ownKing && ownKing.danger_score >= 600) {
    out.push({
      id: "king-own-danger",
      tone: "bad",
      text: "Your king is under heavy fire — prioritize safety over material.",
    });
  } else if (foeKing && foeKing.danger_score >= 600) {
    out.push({
      id: "king-foe-danger",
      tone: "good",
      text: "Their king is exposed — keep the attack rolling and avoid simplifying.",
    });
  } else if (ownKing && !ownKing.castled && moveNo >= 10 && (phase.includes("open") || phase.includes("midd"))) {
    out.push({
      id: "king-castle",
      tone: "info",
      text: "Your king still hasn't castled — tuck it away on the next quiet move.",
    });
  }

  // --- Pawn structure ---------------------------------------------------------
  const ownPawns = blob.pawn_structure?.[mover];
  const iqp = mover === "white" ? blob.pawn_structure?.iqp_white : blob.pawn_structure?.iqp_black;
  const hangingPawns =
    mover === "white"
      ? blob.pawn_structure?.hanging_pawns_white
      : blob.pawn_structure?.hanging_pawns_black;
  if (iqp) {
    out.push({
      id: "pawn-iqp",
      tone: "info",
      text: "Isolated queen pawn on your side: push it toward a break or be ready to defend it.",
    });
  } else if (hangingPawns) {
    out.push({
      id: "pawn-hanging",
      tone: "warn",
      text: "Your hanging pawns need a plan — advance one with backing or expect pressure on both.",
    });
  } else if (ownPawns && ownPawns.passed.length > 0) {
    out.push({
      id: `pawn-passed-${ownPawns.passed[0]}`,
      tone: "good",
      text: `Passed pawn on ${ownPawns.passed[0]} — push it, and don't let it get rounded up.`,
    });
  }

  // --- Material (material_delta_cp is white-relative, like eval_cp) ------------
  const delta = blob.material?.material_delta_cp ?? 0;
  const myDelta = (mover === "white" ? 1 : -1) * delta;
  const pair = mover === "white" ? blob.material?.bishop_pair_white : blob.material?.bishop_pair_black;
  if (myDelta <= -300) {
    out.push({
      id: "mat-down",
      tone: "bad",
      text: "You're down material — complicate the position and hunt for counterplay.",
    });
  } else if (myDelta >= 300) {
    out.push({
      id: "mat-up",
      tone: "good",
      text: "You're up material — simplify into something winning and don't give it back.",
    });
  } else if (pair) {
    out.push({
      id: "mat-pair",
      tone: "good",
      text: "You own the bishop pair — keep the position open and let them breathe.",
    });
  }

  // --- Activity -----------------------------------------------------------------
  const ownActivity = blob.activity?.[mover];
  if (ownActivity?.outposts?.length) {
    const o = ownActivity.outposts[0];
    out.push({
      id: `act-outpost-${o.square}`,
      tone: "good",
      text: `Lovely outpost: ${prettyRole(o.piece)} on ${o.square} can't be chased by pawns — use it.`,
    });
  } else if (ownActivity?.bad_bishop) {
    out.push({
      id: "act-bishop",
      tone: "info",
      text: "Bad bishop alert — it mirrors your own pawns. Free it or trade it off.",
    });
  } else if (ownActivity?.passive_pieces?.length) {
    out.push({
      id: `act-passive-${ownActivity.passive_pieces[0]}`,
      tone: "info",
      text: `${ownActivity.passive_pieces[0]} has no scope — activate your worst piece first.`,
    });
  }

  // --- Feedback on the move just played -------------------------------------------
  const san = pos.move?.san;
  const cls = pos.classification;
  if (san && cls) {
    if (cls === "blunder") {
      out.push({ id: "fb-blunder", tone: "bad", text: `"${san}" lets it slip — slow down and check forcing replies first.` });
    } else if (cls === "mistake") {
      out.push({ id: "fb-mistake", tone: "warn", text: `"${san}" gives something away — compare it with the engine's idea.` });
    } else if (cls === "miss") {
      out.push({ id: "fb-miss", tone: "warn", text: `"${san}" lets their slip go unpunished — punish mistakes immediately.` });
    } else if (cls === "inaccuracy") {
      out.push({ id: "fb-inaccuracy", tone: "info", text: `"${san}" is slightly off — small slips add up, stay precise.` });
    } else if (cls === "brilliant") {
      out.push({ id: "fb-brilliant", tone: "good", text: `"${san}" — superb! A bold, correct call.` });
    } else if (cls === "best" || cls === "great" || cls === "excellent") {
      out.push({ id: "fb-best", tone: "good", text: `"${san}" — the engine's top choice. Clean and precise.` });
    }
  }

  return out.slice(0, MAX_MESSAGES);
}

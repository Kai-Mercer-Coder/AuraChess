/**
 * Coach rules — the declarative rule registry.
 *
 * This is the file to bulk up: add `{ id, when, text[] }` entries. Each rule
 * fires when ALL named conditions in `when` are true (value `false` means the
 * condition must be false). The FIRST matching rule wins and randomly picks
 * one line from its `text[]` (deterministic per game + move). `check(ctx)` is
 * an optional arbitrary predicate for numeric math like `moveNumber < 10`.
 *
 * Order matters: concrete coaching (missed tactics, king threats, passer tips)
 * outranks generic praise, which outranks the quiet fallback.
 *
 * Condition names live in conditions.ts — see the `CONDITIONS` export.
 */
import type { CoachRule } from "./types";

export const RULES: CoachRule[] = [
  // --- Immediate: mate delivered -------------------------------------
  {
    id: "delivered-mate",
    when: { deliveredMate: true },
    tone: "good",
    text: [
      "Checkmate! Textbook finish.",
      "And that's the game — mate.",
      "Beautiful mate. The board is yours.",
      "Mated in style — no way out.",
    ],
  },

  // --- Forced mate available ----------------------------------------
  {
    id: "mate-in-1-available",
    when: { isMateIn1: true, isMiss: false },
    tone: "good",
    text: [
      "Mate is on the board in one — if it's your move, pounce.",
      "You can end this next move. Look for the forcing move.",
      "A single move wins the game. Don't hesitate.",
    ],
  },
  {
    id: "mate-in-2-available",
    when: { isMateIn2: true },
    tone: "good",
    text: [
      "Mate in two is lurking — ride the forcing line home.",
      "Two moves to checkmate if you find the key move.",
      "There's a mating net in two. Calculate it out.",
    ],
  },
  {
    id: "mate-in-3-available",
    when: { isMateIn3: true },
    tone: "good",
    text: [
      "Mate in three — but the route isn't obvious. Find it.",
      "A three-move mate is available. Take your time.",
      "Mating net in three. One forcing line finishes it.",
    ],
  },

  // --- Missed tactics -------------------------------------------------
  {
    id: "missed-fork",
    when: { isMiss: true, isFork: false, isOpponentFork: false },
    tone: "bad",
    text: [
      "You missed a tactical shot here — a fork was on the menu.",
      "There was a fork available. It slipped by.",
      "A fork was hanging there for you. Rewind and find it.",
    ],
  },
  {
    id: "missed-hanging-capture",
    when: { isMiss: true, isOpponentHangingPiece: true },
    tone: "bad",
    text: [
      "You missed it — a piece was hanging to take.",
      "Their piece was en prise and you passed it up.",
      "That was a free gift. Take material next time.",
    ],
  },
  {
    id: "missed-mate-thread",
    when: { isMiss: true, isMateThreat: true },
    tone: "bad",
    text: [
      "You missed a mating idea — it was right there.",
      "A mate threat slipped past. Don't block it next time.",
      "Mate was on the cards and you let it go.",
    ],
  },
  {
    id: "missed-tactic-misc",
    when: { isMiss: true },
    tone: "warn",
    text: [
      "You missed a chance — a tactic was hiding in the position.",
      "Something was there. Punish the opponent's last move.",
      "That was the moment to strike. The tactic slipped by.",
    ],
  },

  // --- Poor moves ----------------------------------------------------
  {
    id: "blunder-general",
    when: { isBlunder: true },
    tone: "bad",
    text: [
      "Ouch — that hands the game over. Check your forcing moves.",
      "That's a blunder. The eval took a nose dive.",
      "A real slip. Before you move, look for forcing replies.",
      "That loses material or position. What was the threat?",
    ],
  },
  {
    id: "mistake-general",
    when: { isMistake: true },
    tone: "warn",
    text: [
      "A mistake — the engine found something you missed.",
      "Slightly off. Compare your move with the engine's idea.",
      "That costs some advantage. What did you overlook?",
    ],
  },
  {
    id: "inaccuracy-general",
    when: { isInaccuracy: true },
    tone: "info",
    text: [
      "A small inaccuracy — good enough, but not the sharpest.",
      "Slightly imprecise. The engine found something crisper.",
      "Not bad, but there was a better path.",
    ],
  },

  // --- Opponent's threats / loose pieces -----------------------------
  {
    id: "opponents-fork-available",
    when: { isOpponentFork: true, isOpening: false },
    tone: "warn",
    text: [
      "Careful — a fork is aimed at your position.",
      "Watch the knight: it's eying a fork.",
      "There's a fork threat coming. Defend first.",
    ],
  },
  {
    id: "opponents-mate-threat",
    when: { isOpponentMateThreat: true, isMiddlegame: true },
    tone: "warn",
    text: [
      "Mating ideas are brewing against your king.",
      "Their attack is winning material or worse.",
      "Defend — the opponent has a threatening tactic.",
    ],
  },
  {
    id: "opponents-discovered",
    when: { isOpponentDiscoveredAttack: true },
    tone: "warn",
    text: [
      "A discovered attack is coming your way.",
      "Their pieces are lined up for a discovery.",
      "Watch the alignment — a discovery threatens you.",
    ],
  },
  {
    id: "opponents-hanging-piece",
    when: { isOpponentHangingPiece: true },
    tone: "good",
    text: [
      "Their piece is loose — take it before they notice.",
      "There's material hanging for you. Grab it.",
      "A gift! Their piece is en prise.",
    ],
  },

  // --- Endgame specifics --------------------------------------------
  {
    id: "endgame-passed-pawn",
    when: { isEndgame: true, hasPassedPawn: true },
    tone: "good",
    text: [
      "You have a passed pawn — push it, don't block it.",
      "Passed pawns must be pushed. Run it forward.",
      "A passer in the endgame is your ticket out.",
    ],
  },
  {
    id: "endgame-king-active",
    when: { isEndgame: true, hasPassedPawn: false, hasBishopPair: false },
    tone: "info",
    text: [
      "In the endgame, activate your king.",
      "Trade pieces, not pawns — activate the king.",
      "Endgame: rooks belong behind passed pawns.",
    ],
  },
  {
    id: "endgame-bishop-pair",
    when: { isEndgame: true, hasBishopPair: true },
    tone: "good",
    text: [
      "Long-range bishops dominate here — keep the board open.",
      "In the endgame the bishops shine. Keep lines open.",
      "Your bishops outduel knights in this endgame.",
    ],
  },

  // --- Material ---------------------------------------------------------
  {
    id: "material-up",
    when: { materialUp: true, losing: false, isEndgame: false },
    tone: "good",
    text: [
      "You're up material — convert calmly.",
      "Material advantage. Trade down and win.",
      "Ahead on material — simplify if you can.",
    ],
  },
  {
    id: "material-down",
    when: { materialDown: true },
    tone: "warn",
    text: [
      "You're down material — look for compensation and activity.",
      "Behind on material. Fight for counterplay.",
      "Material is lost — complicate the position.",
    ],
  },

  // --- King safety -----------------------------------------------------
  {
    id: "king-danger",
    when: { kingDanger: true },
    tone: "bad",
    text: [
      "Your king is exposed. Patch the defense first.",
      "King in danger — defend before attacking.",
      "Your king needs shelter. Consider castling or a quiet defense.",
    ],
  },
  {
    id: "opponent-king-danger",
    when: { opponentKingDanger: true },
    tone: "good",
    text: [
      "Their king is exposed — keep the attack rolling.",
      "Opponent's king is weak. Open it up more.",
      "Attack! Their king has no shelter.",
    ],
  },
  {
    id: "king-uncastled",
    when: { kingUncastled: true, isMiddlegame: true },
    tone: "info",
    text: [
      "You haven't castled yet — tuck the king away.",
      "Castling is overdue. Get the king safe and connect rooks.",
      "King still in the center. Castle soon.",
    ],
  },

  // --- Positional ---------------------------------------------------------
  {
    id: "outpost",
    when: { hasOutpost: true },
    tone: "good",
    text: [
      "A knight outpost — a piece that can't be chased.",
      "Outpost secured. Plant a knight and enjoy the square.",
      "Central outpost — parking a minor piece there wins space.",
    ],
  },
  {
    id: "bad-bishop",
    when: { badBishop: true },
    tone: "info",
    text: [
      "You have a bad bishop — it's blocked by your own pawns.",
      "That bishop is bad. If possible, trade it or give it air.",
      "Your poor bishop stares at its own pawns. Redeploy it.",
    ],
  },
  {
    id: "pawns-isolated",
    when: { hasIsolatedPawn: true },
    tone: "info",
    text: [
      "An isolated pawn can be a target or a strength — decide which it is.",
      "Isolated pawn: valuable central space, but hard to defend.",
      "Watch the isolated pawn — it's a permanent weakness.",
    ],
  },
  {
    id: "bishop-pair-midgame",
    when: { hasBishopPair: true, isMiddlegame: true },
    tone: "good",
    text: [
      "You have the bishop pair — open the position up.",
      "Bishop pair is a real asset. Use the open diagonals.",
      "The bishops are glad. Trade minors, keep bishops.",
    ],
  },

  // --- Opening phase -------------------------------------------------
  {
    id: "opening-good-start",
    when: { isOpening: true, isGood: true, isMistake: false, isBlunder: false },
    tone: "good",
    text: [
      "A good start — you're fighting for the center.",
      "Sound opening move. Developing with a plan.",
      "Opening principle in action: create, then occupy, the center.",
    ],
  },
  {
    id: "opening-book",
    when: { isOpening: true, isBook: true },
    tone: "info",
    text: [
      "Book move — opening theory in action.",
      "That's straight from the books.",
      "Theoretical. Well-known response.",
    ],
  },
  {
    id: "opening-gambit",
    when: { isOpening: true, isRisky: true, isGood: false },
    tone: "info",
    text: [
      "A spicy opening choice — the complications begin.",
      "Aggressive start. Both sides have chances.",
      "An offbeat first move — tread carefully.",
    ],
  },
  {
    id: "opening-dev",
    when: { isOpening: true },
    tone: "info",
    text: [
      "Keep developing — get your pieces off the back rank.",
      "Opening: develop knights and bishops before pawn pushes.",
      "Castle early and connect rooks.",
    ],
  },

  // --- Phase shifts ----------------------------------------------------
  {
    id: "om-transition",
    when: { isOM: true },
    tone: "info",
    text: [
      "Opening ends, the middlegame begins — activate your pieces.",
      "We're out of the opening. Time to find a plan.",
      "Transition to the middlegame — aim at weaknesses.",
    ],
  },
  {
    id: "me-transition",
    when: { isME: true },
    tone: "info",
    text: [
      "Middlegame to endgame — trade down if you're better.",
      "The endgame is coming — centralize the king later.",
      "Phase shift ahead: think about pawn structure long-term.",
    ],
  },

  // --- Good play (praise) ---------------------------------------------
  {
    id: "brilliant-move",
    when: { isBrilliant: true },
    tone: "good",
    text: [
      "Brilliant!! A move the engine loves.",
      "Wow — that's a brilliant move. Stunning.",
      "Exceptional. The engine's flashiest idea.",
    ],
  },
  {
    id: "great-move",
    when: { isGreat: true },
    tone: "good",
    text: [
      "Great move — you exploited your opponent's slip.",
      "! A strong move that keeps full advantage.",
      "Excellent punishment. Very strong.",
    ],
  },
  {
    id: "best-move",
    when: { isBest: true },
    tone: "good",
    text: [
      "The engine's choice — perfectly played.",
      "Best move. Nothing better exists here.",
      "Optimal — Stockfish agrees.",
    ],
  },
  {
    id: "excellent-move",
    when: { isExcellent: true },
    tone: "good",
    text: [
      "Excellent — a near-flawless move.",
      "Very strong. Keeps all your advantage.",
      "Sharp and correct.",
    ],
  },
  {
    id: "good-move",
    when: { isGood: true },
    tone: "info",
    text: [
      "A solid, good move.",
      "Good — maintains the position.",
      "Reasonable and sound.",
    ],
  },
  {
    id: "book-move",
    when: { isBook: true },
    tone: "info",
    text: [
      "Known theory — solid book response.",
      "From the book — nothing to judge here.",
      "Theory. Keep following the plan.",
    ],
  },

  // --- Generic / catchall ---------------------------------------------
  {
    id: "move-fine",
    tone: "info",
    text: [
      "A reasonable move — nothing special, but no mistakes.",
      "Fine. Tempo is fine.",
      "Reasonable. The position holds.",
      "Normal move. Game continues.",
    ],
  },
];
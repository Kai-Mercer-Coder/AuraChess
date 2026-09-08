/**
 * Review page — thin orchestrator.
 *
 * Owns the flow state (PGN input → analysing → report) and composes the
 * review feature components (board, move list, accuracy, navigation). All
 * engine work happens in `useGameReview`; all presentation lives in
 * `@/components/review/*`.
 */
"use client";

import { useCallback, useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { useGameReview } from "@/lib/hooks/useGameReview";
import { PgnForm } from "@/components/review/PgnForm";
import { ReviewBoard } from "@/components/review/ReviewBoard";
import { ReviewProgress } from "@/components/review/ReviewProgress";
import { AccuracyCards } from "@/components/review/AccuracyCards";
import { MoveList } from "@/components/review/MoveList";
import { ClassificationLegend } from "@/components/review/ClassificationLegend";
import { ReviewNavigation } from "@/components/review/ReviewNavigation";

export default function ReviewPage() {
  const [pgn, setPgn] = useState("");
  const [moves, setMoves] = useState<string[]>([]);
  const [navIndex, setNavIndex] = useState(0);
  const [started, setStarted] = useState(false);

  const { report, loading, progress, total, runReview, reset } = useGameReview();

  const handleAnalyse = useCallback(async () => {
    if (!pgn.trim()) return;
    try {
      const g = new Chess();
      g.loadPgn(pgn.trim());
      setMoves(g.history());
      setNavIndex(0);
      setStarted(true);
      await runReview(pgn.trim(), { maxPasses: 2 });
    } catch {
      alert("Invalid PGN. Please check the moves.");
    }
  }, [pgn, runReview]);

  // Rebuild the position up to navIndex for display, tracking the last move's
  // from/to squares so the board can highlight it.
  const boardState = useMemo(() => {
    if (moves.length === 0) return { fen: new Chess().fen(), lastMove: null };
    const g = new Chess();
    let lastMove: { from: Square; to: Square } | null = null;
    for (let i = 0; i < navIndex && i < moves.length; i++) {
      try {
        lastMove = g.move(moves[i]);
      } catch {
        break;
      }
    }
    return { fen: g.fen(), lastMove };
  }, [moves, navIndex]);

  const positions = report?.positions ?? [];
  const currentClassification =
    navIndex > 0 ? positions[navIndex]?.classification : undefined;

  const handleResetBtn = () => {
    reset();
    setStarted(false);
    setMoves([]);
    setNavIndex(0);
    setPgn("");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-display text-2xl font-bold tracking-tighter">
          Aura<span className="text-white/40">Chess</span>
        </span>
        <span className="text-[10px] uppercase tracking-widest text-white/40 border border-white/10 rounded-full px-3 py-1">
          100% Free · Local Engine
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-20">
        {!started ? (
          <PgnForm
            value={pgn}
            onChange={setPgn}
            onAnalyse={handleAnalyse}
            loading={loading}
          />
        ) : (
          <div className="pt-6">
            {loading && <ReviewProgress progress={progress} total={total} />}

            <div className="grid grid-cols-12 gap-6 items-start">
              {/* Board + navigation */}
              <div className="col-span-12 md:col-span-6">
                <ReviewBoard
                  fen={boardState.fen}
                  lastMove={boardState.lastMove}
                  classification={currentClassification}
                />
                <ReviewNavigation
                  hasPrevious={navIndex > 0}
                  hasNext={navIndex < moves.length}
                  onPrevious={() => setNavIndex((n) => Math.max(0, n - 1))}
                  onNext={() => setNavIndex((n) => Math.min(moves.length, n + 1))}
                  onNew={handleResetBtn}
                />
              </div>

              {/* Right panel */}
              <div className="col-span-12 md:col-span-6">
                {report && <AccuracyCards report={report} />}
                <MoveList
                  moves={moves}
                  positions={positions}
                  navIndex={navIndex}
                  onSelectMove={setNavIndex}
                />
                <ClassificationLegend />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
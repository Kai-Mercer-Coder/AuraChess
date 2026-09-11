/**
 * Review page — thin orchestrator.
 *
 * Owns the flow state (PGN input → analysing → report) and composes the
 * review feature components (board, move list, accuracy, navigation). All
 * engine work happens in `useGameReview`; all presentation lives in
 * `@/components/review/*`.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { useGameReview } from "@/lib/hooks/useGameReview";
import { PgnForm } from "@/components/review/PgnForm";
import {
  SAMPLE_GAMES,
  pickRandomSamples,
  type SampleGame,
} from "@/lib/chess/sampleGames";
import { ReviewBoard } from "@/components/review/ReviewBoard";
import { EvalBar } from "@/components/review/EvalBar";
import { ReviewProgress } from "@/components/review/ReviewProgress";
import { AccuracyCards } from "@/components/review/AccuracyCards";
import { MoveList } from "@/components/review/MoveList";
import { ReviewNavigation } from "@/components/review/ReviewNavigation";
import { CoachCard } from "@/components/review/CoachCard";
import { PositionAnalysisPanel } from "@/components/review/PositionAnalysisPanel";
import { HeatmapPanel } from "@/components/review/heatmap/HeatmapPanel";
import { getCoachMessages } from "@/lib/chess/coach";
import {
  computeSpaceHeatmap,
  computeKingHeatmap,
  buildZoneOverlay,
  type HeatmapKind,
  type SpaceMode,
  type KingMode,
} from "@/lib/chess/heatmap";

export default function ReviewPage() {
  const [pgn, setPgn] = useState("");
  const [moves, setMoves] = useState<string[]>([]);
  const [navIndex, setNavIndex] = useState(0);
  const [started, setStarted] = useState(false);
  // Accordion: at most one of the side panels is open at a time.
  const [openPanel, setOpenPanel] = useState<"moves" | "analysis" | "heatmap" | null>("moves");
  const [heatmapKind, setHeatmapKind] = useState<HeatmapKind>("space");
  const [spaceMode, setSpaceMode] = useState<SpaceMode>("all");
  const [kingMode, setKingMode] = useState<KingMode>("theoretical");
  // Landing samples: deterministic first paint (SSR-safe), then 2 random.
  const [samplePicks, setSamplePicks] = useState<SampleGame[]>(() =>
    SAMPLE_GAMES.slice(0, 2),
  );

  useEffect(() => {
    setSamplePicks(pickRandomSamples(2));
  }, []);

  const { report, loading, progress, total, analysisPass, completedMoves, runReview, reset } =
    useGameReview();

  const handleAnalyse = useCallback(async () => {
    if (!pgn.trim()) return;
    try {
      const g = new Chess();
      g.loadPgn(pgn.trim());
      setMoves(g.history());
      setNavIndex(0);
      setStarted(true);
      await runReview(pgn.trim(), { maxPasses: 3 });
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
  const currentPositionAnalysis =
    navIndex > 0
      ? positions[navIndex]?.positionAnalysis
      : positions[0]?.positionAnalysis;
  const currentEval =
    positions.length > 0
      ? positions[Math.min(navIndex, positions.length - 1)]?.topLines?.[0]?.evaluation
      : undefined;

  // Heatmap geometry for the displayed position. The board overlay (tints)
  // is only live while the heatmap panel is open; the Undefended kind uses
  // the piece ring instead (see showHanging).
  const spaceData = useMemo(
    () => computeSpaceHeatmap(boardState.fen),
    [boardState.fen],
  );
  const kingData = useMemo(
    () => computeKingHeatmap(boardState.fen, kingMode),
    [boardState.fen, kingMode],
  );
  const heatmapOverlay = useMemo(() => {
    if (openPanel !== "heatmap") return null;
    if (heatmapKind === "space")
      return buildZoneOverlay(spaceData.white, spaceData.black, spaceMode);
    if (heatmapKind === "king")
      return buildZoneOverlay(kingData.white, kingData.black, "all");
    return null;
  }, [openPanel, heatmapKind, spaceData, kingData, spaceMode]);
  const showHanging = openPanel === "heatmap" && heatmapKind === "undefended";

  // Coach tips for the displayed position; refresh as you step through moves.
  const coachMessages = useMemo(() => {
    if (positions.length === 0) return [];
    return getCoachMessages(positions[Math.min(navIndex, positions.length - 1)]);
  }, [positions, navIndex]);

  const handleResetBtn = () => {
    reset();
    setStarted(false);
    setMoves([]);
    setNavIndex(0);
    setPgn("");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/60 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="font-display text-xl font-bold tracking-tight">
            Aura<span className="text-white/40">Chess</span>
          </span>
          <div className="flex items-center gap-4">
            {started && (
              <button
                onClick={handleResetBtn}
                className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-white"
              >
                New review
              </button>
            )}
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-white/40">
              Local engine
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {!started ? (
          <PgnForm
            value={pgn}
            onChange={setPgn}
            onAnalyse={handleAnalyse}
            loading={loading}
            samples={samplePicks}
            onPickSample={setPgn}
            onShuffleSamples={() => setSamplePicks(pickRandomSamples(2))}
          />
        ) : (
          <div className="pt-8">
            {loading && (
              <ReviewProgress
                progress={progress}
                total={total}
                analysisPass={analysisPass}
              />
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-7">
              {/* Board + navigation */}
              <div className="lg:col-span-6">
                <div className="flex items-stretch gap-2.5">
                  <EvalBar evaluation={currentEval} />
                  <div className="min-w-0 flex-1">
                    <ReviewBoard
                      fen={boardState.fen}
                      lastMove={boardState.lastMove}
                      classification={currentClassification}
                      positionAnalysis={currentPositionAnalysis}
                      heatmap={heatmapOverlay}
                      showHanging={showHanging}
                    />
                  </div>
                </div>
                <ReviewNavigation
                  hasPrevious={navIndex > 0}
                  hasNext={navIndex < moves.length}
                  navIndex={navIndex}
                  total={moves.length}
                  classification={currentClassification}
                  onPrevious={() => setNavIndex((n) => Math.max(0, n - 1))}
                  onNext={() => setNavIndex((n) => Math.min(moves.length, n + 1))}
                />
                <CoachCard messages={coachMessages} />
              </div>

              {/* Right panel */}
              <div className="flex flex-col gap-3.5 lg:col-span-6">
                {report && <AccuracyCards report={report} />}
                <MoveList
                  moves={moves}
                  positions={positions}
                  navIndex={navIndex}
                  onSelectMove={setNavIndex}
                  analysing={loading}
                  analysedCount={completedMoves}
                  open={openPanel === "moves"}
                  onToggle={() => setOpenPanel((p) => (p === "moves" ? null : "moves"))}
                />
                <PositionAnalysisPanel
                  positionAnalysis={currentPositionAnalysis}
                  open={openPanel === "analysis"}
                  onToggle={() => setOpenPanel((p) => (p === "analysis" ? null : "analysis"))}
                />
                <HeatmapPanel
                  kind={heatmapKind}
                  onKindChange={setHeatmapKind}
                  space={spaceData}
                  spaceMode={spaceMode}
                  onSpaceModeChange={setSpaceMode}
                  king={kingData}
                  kingMode={kingMode}
                  onKingModeChange={setKingMode}
                  hangingWhite={currentPositionAnalysis?.hangingWhite ?? []}
                  hangingBlack={currentPositionAnalysis?.hangingBlack ?? []}
                  open={openPanel === "heatmap"}
                  onToggle={() => setOpenPanel((p) => (p === "heatmap" ? null : "heatmap"))}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
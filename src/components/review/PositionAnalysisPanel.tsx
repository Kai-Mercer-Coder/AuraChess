/**
 * Position analysis panel.
 *
 * Renders the Rust analyzer's structured `Explanation` blob for the current
 * position: verdict, evaluation breakdown, material, pawn structure, king
 * safety, activity, themes, and detected hanging/pinned pieces. Collapsed by
 * default so the board stays the focus.
 */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import type {
  PositionAnalysis,
  KingSideAnalysis,
} from "@/lib/chess/engine-rs/types";

interface PositionAnalysisPanelProps {
  positionAnalysis?: PositionAnalysis | null;
  open: boolean;
  onToggle: () => void;
}

export function PositionAnalysisPanel({ positionAnalysis, open, onToggle }: PositionAnalysisPanelProps) {
  if (!positionAnalysis?.explanation) return null;

  const blob = positionAnalysis.explanation;
  const hanging = [
    ...(positionAnalysis.hangingWhite ?? []),
    ...(positionAnalysis.hangingBlack ?? []),
  ];
  const pinned = blob.tactics.pinned_pieces ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] fade-up">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/[0.03]"
      >
        <span className="flex items-center gap-2 text-[12px] font-medium text-white/70">
          <span className="material-symbols-outlined text-[16px] text-white/40">
            insights
          </span>
          Position intelligence
        </span>
        <span
          className={`material-symbols-outlined text-[18px] text-white/30 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Verdict */}
              <div className="flex items-start justify-between gap-4 border-t border-white/[0.04] py-3">
            <div className="min-w-0">
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/30">
                {blob.phase} · {blob.side_to_move} to move
              </div>
              <p className="mt-1.5 text-[12px] font-light leading-relaxed text-white/75">
                {blob.verdict}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[22px] font-semibold leading-none tabular-nums text-white/90">
                {blob.eval_cp >= 0 ? "+" : "−"}
                {Math.abs(blob.eval_pawns).toFixed(2)}
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-widest text-white/25">
                eval
              </div>
            </div>
          </div>

          {/* Evaluation breakdown */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 rounded-xl bg-black/25 p-3">
            <EvalRow label="Material" value={blob.eval_breakdown.material_cp} />
            <EvalRow label="Pieces" value={blob.eval_breakdown.psqt_cp} />
            <EvalRow label="Mobility" value={blob.eval_breakdown.mobility_cp} />
            <EvalRow label="Pawns" value={blob.eval_breakdown.pawns_cp} />
            <EvalRow label="King safety" value={blob.eval_breakdown.king_safety_cp} />
            <EvalRow label="Threats" value={blob.eval_breakdown.threats_cp} />
            <EvalRow label="Imbalance" value={blob.eval_breakdown.imbalance_cp} />
          </div>

          <Section title="Material">
            <p className="text-[12px] font-light leading-relaxed text-white/70">
              {blob.material.summary}
            </p>
          </Section>

          <Section title="Pawn structure">
            <p className="text-[12px] font-light leading-relaxed text-white/70">
              {blob.pawn_structure.summary}
            </p>
          </Section>

          <Section title="King safety">
            <p className="text-[12px] font-light leading-relaxed text-white/70">
              {blob.king_safety.summary}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <KingCard side="W" analysis={blob.king_safety.white} />
              <KingCard side="B" analysis={blob.king_safety.black} />
            </div>
          </Section>

          <Section title="Activity">
            <p className="text-[12px] font-light leading-relaxed text-white/70">
              {blob.activity.summary}
            </p>
          </Section>

          {/* Themes — side-keyed so white/black duplicates don't collide. */}
          <Section title="Themes">
            {blob.themes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {blob.themes.map((t) => (
                  <span
                    key={`${t.id}-${t.side}`}
                    title={t.description}
                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/60"
                  >
                    {t.side && <span className="h-1 w-1 rounded-full bg-white/30" />}
                    {t.id.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] font-light text-white/35">
                No strong themes detected.
              </p>
            )}
          </Section>

          {/* Tactics — hanging & pinned side by side when present. */}
          {hanging.length > 0 || pinned.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 border-t border-white/[0.04] py-3 sm:grid-cols-2">
              {hanging.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/30">
                    Hanging
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {hanging.map((h) => (
                      <Chip
                        key={`h-${h.square}-${h.role}`}
                        tone="red"
                      >
                        {h.role} {h.square} (−{Math.round(h.loss_cp / 100)})
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
              {pinned.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/30">
                    Pinned
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pinned.map((p) => (
                      <Chip
                        key={`p-${p.square}-${p.pinned_to_role}`}
                        tone="amber"
                      >
                        {p.role} {p.square} → {p.pinned_to_role}
                        {p.absolute ? " · absolute" : ""}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EvalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-white/40">{label}</span>
      <span
        className={`font-medium tabular-nums ${
          value >= 0 ? "text-emerald-300/90" : "text-red-300/90"
        }`}
      >
        {value >= 0 ? "+" : "−"}
        {Math.abs(Math.round(value))}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-white/[0.04] py-3">
      <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/30">
        {title}
      </div>
      {children}
    </div>
  );
}

function KingCard({ side, analysis }: { side: string; analysis: KingSideAnalysis }) {
  if (!analysis) return null;
  const danger = analysis.danger_score;
  const dangerColor =
    danger > 700 ? "text-red-300" : danger > 350 ? "text-amber-300" : "text-emerald-300";
  return (
    <div className="rounded-xl bg-black/25 px-2.5 py-2">
      <div className="flex items-center justify-between">
        <span className="text-[9.5px] font-semibold uppercase tracking-widest text-white/40">
          {side} · K{analysis.king_square}
          {analysis.castled ? " · castled" : ""}
        </span>
        <span className={`text-[16px] font-semibold leading-none tabular-nums ${dangerColor}`}>
          {Math.max(0, Math.round((1 - danger / 1000) * 9))}
        </span>
      </div>
      <div className="mt-1.5 text-[10px] font-light text-white/40">
        danger {danger} · shield {analysis.pawn_shield_score} · {analysis.attacker_count}{" "}
        attacker{analysis.attacker_count === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone: "red" | "amber" }) {
  const cls =
    tone === "red"
      ? "border-red-500/15 bg-red-500/[0.08] text-red-200/80"
      : "border-amber-500/15 bg-amber-500/[0.08] text-amber-200/80";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}
    >
      {children}
    </span>
  );
}
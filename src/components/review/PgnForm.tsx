/**
 * Landing hero: PGN input + kick off the review.
 *
 * Shown before any game is analysed. Validation lives in the parent
 * (`handleAnalyse`); this component is deliberately pure/stateless.
 */
"use client";

import type { SampleGame } from "@/lib/chess/sampleGames";

interface PgnFormProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyse: () => void;
  loading: boolean;
  samples: SampleGame[];
  onPickSample: (pgn: string) => void;
  onShuffleSamples: () => void;
}

export function PgnForm({
  value,
  onChange,
  onAnalyse,
  loading,
  samples,
  onPickSample,
  onShuffleSamples,
}: PgnFormProps) {
  return (
    <div className="relative mx-auto max-w-xl px-6 pb-16 pt-24 text-center">
      {/* Soft aura behind the hero. */}
      <div className="pointer-events-none absolute -top-16 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-white/[0.05] blur-3xl" />

      <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/30">
        AuraChess · Game review
      </p>
      <h1 className="font-display text-5xl font-medium tracking-tight text-white sm:text-6xl">
        Review your game.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-[15px] font-light leading-relaxed text-white/45">
        Paste any PGN and get every move classified — Brilliant to Blunder — with
        positional intelligence. All in your browser.
      </p>

      <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-left backdrop-blur-sm fade-up">
        <label className="block pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
          Paste PGN
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 …"
          rows={9}
          className="w-full resize-none rounded-xl border border-white/[0.06] bg-black/40 p-4 font-mono text-[13px] leading-relaxed text-white/80 placeholder:text-white/20 focus:border-white/25 focus:outline-none"
        />
        <button
          onClick={onAnalyse}
          disabled={!value.trim() || loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-all hover:bg-neutral-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
        >
          {loading ? (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" />
              Analysing…
            </>
          ) : (
            "Analyse"
          )}
        </button>
        <p className="pt-3 text-center text-[10px] font-light tracking-wide text-white/25">
          Free · No account · Runs on local Stockfish
        </p>
      </div>

      {/* Sample games: 2 random picks, reshufflable */}
      <div className="mt-6 text-left fade-up">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
            Or try a sample game
          </span>
          <button
            type="button"
            onClick={onShuffleSamples}
            title="Show different samples"
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-all hover:bg-white/[0.06] hover:text-white active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">shuffle</span>
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {samples.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onPickSample(s.pgn)}
              className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-left transition-all hover:bg-white/[0.05] active:scale-[0.98]"
            >
              <div className="truncate text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/30">
                {s.event}
              </div>
              <div className="mt-1 truncate text-[12.5px] font-medium text-white/80">
                {s.white} <span className="font-light text-white/25">vs</span> {s.black}
              </div>
              <div className="mt-1.5">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white/50">
                  {s.result}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
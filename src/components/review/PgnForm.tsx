/**
 * Landing hero: PGN input + kick off the review.
 *
 * Shown before any game is analysed. Validation lives in the parent
 * (`handleAnalyse`); this component is deliberately pure/stateless.
 */
"use client";

interface PgnFormProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyse: () => void;
  loading: boolean;
}

export function PgnForm({ value, onChange, onAnalyse, loading }: PgnFormProps) {
  return (
    <div className="max-w-lg mx-auto pt-16">
      <h1 className="font-display text-4xl font-bold tracking-tighter text-white">
        Review your game.
      </h1>
      <p className="text-white/50 font-light mt-3">
        Paste any PGN and get every move classified — Brilliant, Best,
        Inaccuracy, Mistake, Blunder — plus accuracy scores. Runs entirely in
        your browser.
      </p>
      <div className="mt-8">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-white/50">
          Paste your PGN
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={"1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 ..."}
          rows={10}
          className="mt-2 w-full resize-none rounded-xl bg-white/[0.03] border border-white/10 p-4 text-sm text-white/80 placeholder:text-white/20 font-mono focus:outline-none focus:border-white/30"
        />
        <button
          onClick={onAnalyse}
          disabled={!value.trim() || loading}
          className="mt-4 w-full py-3 rounded-full bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Analysing…" : "Analyse Free"}
        </button>
      </div>
    </div>
  );
}
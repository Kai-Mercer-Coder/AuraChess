/**
 * Coach card: plain-language tips for the current position.
 *
 * Sits under the board navigation and refreshes as you step through moves.
 * Shows a quiet placeholder until analysis data lands for the position.
 */
"use client";

import type { CoachMessage, CoachTone } from "@/lib/chess/coach";

const TONE_DOT: Record<CoachTone, string> = {
  good: "#34d399",
  warn: "#fbbf24",
  bad: "#f87171",
  info: "rgba(255,255,255,0.35)",
};

export function CoachCard({ messages }: { messages: CoachMessage[] }) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] fade-up">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <span className="material-symbols-outlined text-[16px] text-white/40">
          school
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
          Coach
        </span>
      </div>
      <div className="border-t border-white/[0.04] px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-[12px] font-light text-white/30">
            Tips appear here as analysis lands for this position.
          </p>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <li key={m.id} className="flex items-start gap-2">
                <span
                  className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full"
                  style={{ backgroundColor: TONE_DOT[m.tone] }}
                />
                <span className="text-[12px] font-light leading-relaxed text-white/75">
                  {m.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Classification breakdown: trigger button + dialog with per-side counts.
 *
 * Rendered inside the session summary card once a Report is ready. Counts
 * come straight from `report.classifications` (white vs black), so the
 * dialog always matches the analysed game. Closes on backdrop click or
 * Escape.
 */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type Report from "@/lib/types/Report";
import type { Classification } from "@/lib/types/Classification";
import {
  reviewCategories,
  classificationVisuals,
} from "@/components/review/classificationVisuals";

export function ClassificationBreakdown({ report }: { report: Report }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open ]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-full border border-white/[0.08] py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80 active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-[15px]">bar_chart</span>
        Full breakdown
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
                <span className="text-[12px] font-medium text-white/80">
                  Move classifications
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto px-5 py-2 custom-scrollbar">
                <div className="grid grid-cols-[1fr_2.5rem_2.5rem] items-center gap-y-0.5 border-b border-white/[0.06] py-2 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/30">
                  <span>Move</span>
                  <span className="text-center" title="White">W</span>
                  <span className="text-center" title="Black">B</span>
                </div>
                {reviewCategories.map((c) => {
                  const vis = classificationVisuals[c.key];
                  const w = report.classifications.white[c.key as Classification] ?? 0;
                  const b = report.classifications.black[c.key as Classification] ?? 0;
                  return (
                    <div
                      key={c.key}
                      className="grid grid-cols-[1fr_2.5rem_2.5rem] items-center py-[7px]"
                    >
                      <span className="flex items-center gap-2 text-[12px] text-white/70">
                        <span
                          className="h-[7px] w-[7px] shrink-0 rounded-[2.5px]"
                          style={{ backgroundColor: vis?.badgeBg, opacity: 0.9 }}
                        />
                        {c.label}
                      </span>
                      <span
                        className={`text-center text-[12px] tabular-nums ${
                          w > 0 ? "font-semibold text-white/85" : "font-light text-white/20"
                        }`}
                      >
                        {w}
                      </span>
                      <span
                        className={`text-center text-[12px] tabular-nums ${
                          b > 0 ? "font-semibold text-white/85" : "font-light text-white/20"
                        }`}
                      >
                        {b}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

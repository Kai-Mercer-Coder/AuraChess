/**
 * Review legend — one colored dot + label per classification.
 * Shows the first ten categories (the ones most users need to decode).
 */
"use client";

import {
  reviewCategories,
  classificationVisuals,
} from "@/components/review/classificationVisuals";

export function ClassificationLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 pb-1">
      {reviewCategories.slice(0, 10).map((c) => {
        const vis = classificationVisuals[c.key];
        return (
          <span
            key={c.key}
            className="inline-flex items-center gap-1.5 text-[9.5px] font-medium uppercase tracking-[0.14em] text-white/30"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: vis?.badgeBg, opacity: 0.85 }}
            />
            {c.label}
          </span>
        );
      })}
    </div>
  );
}
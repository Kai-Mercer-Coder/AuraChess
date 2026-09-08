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
    <div className="mt-4 flex flex-wrap gap-2">
      {reviewCategories.slice(0, 10).map((c) => {
        const vis = classificationVisuals[c.key];
        return (
          <span
            key={c.key}
            className="inline-flex items-center gap-1.5 text-[10px] text-white/40"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: vis?.badgeBg }}
            />
            {c.label}
          </span>
        );
      })}
    </div>
  );
}
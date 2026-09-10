/** Shared pill controls for the heatmap sections. */
"use client";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; icon?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full border border-white/[0.07] bg-black/25 p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-all ${
            value === o.key
              ? "bg-white/[0.12] text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          {o.icon && (
            <span className="material-symbols-outlined text-[14px]">{o.icon}</span>
          )}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-light tabular-nums text-white/50">
      <span
        className="h-2 w-2 rounded-[3px]"
        style={{ backgroundColor: color, opacity: 0.85 }}
      />
      {label}
    </span>
  );
}

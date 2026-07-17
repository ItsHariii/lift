"use client";

import { tick } from "@/lib/haptics";

export default function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  decimals = 0,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  decimals?: number;
}) {
  const set = (next: number) => {
    onChange(Math.max(min, Math.round(next * 100) / 100));
    tick();
  };
  const display = Number.isInteger(value)
    ? String(value)
    : value.toFixed(decimals || 1);

  return (
    <div className="flex-1">
      <div className="label mb-[7px] text-center tracking-[0.16em]">
        {label}
      </div>
      <div className="flex items-stretch overflow-hidden rounded-[14px] border border-line bg-bg-2">
        <button
          type="button"
          aria-label={`decrease ${label}`}
          onClick={() => set(value - step)}
          className="w-11 shrink-0 border-0 bg-transparent text-[26px] text-text-dim active:bg-surface-2 active:text-accent"
        >
          −
        </button>
        <div className="flex flex-1 items-center justify-center border-x border-line py-[9px]">
          <span className="display text-[32px] leading-none tracking-[0.02em] tabular-nums">
            {display}
          </span>
        </div>
        <button
          type="button"
          aria-label={`increase ${label}`}
          onClick={() => set(value + step)}
          className="w-11 shrink-0 border-0 bg-transparent text-[26px] text-text-dim active:bg-surface-2 active:text-accent"
        >
          +
        </button>
      </div>
    </div>
  );
}

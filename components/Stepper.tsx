"use client";

import { tick } from "@/lib/haptics";

/** Fixed increment, or one derived from the value being stepped away from. */
type Step = number | ((value: number, direction: 1 | -1) => number);

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
  step?: Step;
  min?: number;
  decimals?: number;
}) {
  const set = (next: number) => {
    onChange(Math.max(min, Math.round(next * 100) / 100));
    tick();
  };

  const stepAt = (at: number, direction: 1 | -1) =>
    typeof step === "function" ? step(at, direction) : step;
  // Stepping down looks just below the current value, so a threshold sitting
  // exactly on the value (50lb) uses the smaller increment on the way back down.
  const decrement = () => set(value - stepAt(value - 1e-6, -1));
  const increment = () => set(value + stepAt(value, 1));
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
          onClick={decrement}
          className="w-[clamp(38px,10vw,44px)] shrink-0 border-0 bg-transparent text-[26px] text-text-dim active:bg-surface-2 active:text-accent"
        >
          −
        </button>
        <div className="flex flex-1 items-center justify-center border-x border-line py-[9px]">
          <span className="display text-[clamp(28px,7.5vw,32px)] leading-none tracking-[0.02em] tabular-nums">
            {display}
          </span>
        </div>
        <button
          type="button"
          aria-label={`increase ${label}`}
          onClick={increment}
          className="w-[clamp(38px,10vw,44px)] shrink-0 border-0 bg-transparent text-[26px] text-text-dim active:bg-surface-2 active:text-accent"
        >
          +
        </button>
      </div>
    </div>
  );
}

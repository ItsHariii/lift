"use client";

import { tick } from "@/lib/haptics";

export default function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  suffix,
  decimals = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  suffix?: string;
  decimals?: number;
}) {
  const set = (v: number) => {
    const clamped = Math.max(min, Math.round(v * 100) / 100);
    onChange(clamped);
    tick();
  };
  const display = Number.isInteger(value) ? String(value) : value.toFixed(decimals || 1);

  return (
    <div className="flex-1">
      <div className="label mb-1.5 text-center">{label}</div>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-bg">
        <button
          type="button"
          aria-label={`decrease ${label}`}
          onClick={() => set(value - step)}
          className="w-11 shrink-0 text-2xl text-text-dim active:bg-surface-2 active:text-accent"
        >
          −
        </button>
        <div className="flex flex-1 items-baseline justify-center gap-1 border-x border-line py-2.5">
          <span className="num text-3xl font-bold leading-none text-text">{display}</span>
          {suffix && <span className="label !text-[0.6rem]">{suffix}</span>}
        </div>
        <button
          type="button"
          aria-label={`increase ${label}`}
          onClick={() => set(value + step)}
          className="w-11 shrink-0 text-2xl text-text-dim active:bg-surface-2 active:text-accent"
        >
          +
        </button>
      </div>
    </div>
  );
}

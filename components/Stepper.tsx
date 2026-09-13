"use client";

import { useEffect, useRef, useState } from "react";
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
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Select the text once when editing opens, not on every keystroke — reselecting
  // after each change would make the next digit replace what was just typed.
  const editing = draft !== null;
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  // Blank or unparseable input keeps the value it had before the edit.
  const commit = () => {
    const parsed = Number.parseFloat(draft ?? "");
    if (Number.isFinite(parsed)) set(parsed);
    setDraft(null);
  };

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
          {draft === null ? (
            <button
              type="button"
              aria-label={`edit ${label}`}
              onClick={() => setDraft(display)}
              className="display w-full border-0 bg-transparent text-center text-[clamp(28px,7.5vw,32px)] leading-none tracking-[0.02em] tabular-nums"
            >
              {display}
            </button>
          ) : (
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              aria-label={label}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") setDraft(null);
              }}
              className="display w-full border-0 bg-transparent text-center text-[clamp(28px,7.5vw,32px)] leading-none tracking-[0.02em] tabular-nums text-accent outline-none"
            />
          )}
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

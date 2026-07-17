"use client";

import { useEffect, useRef, useState } from "react";
import { alarm, tick } from "@/lib/haptics";

export default function RestTimer({
  startedAt,
  duration,
  onDismiss,
}: {
  startedAt: number | null;
  duration: number;
  onDismiss: () => void;
}) {
  const [extraState, setExtraState] = useState({
    startedAt: null as number | null,
    seconds: 0,
  });
  const [remaining, setRemaining] = useState(duration);
  const firedForRef = useRef<number | null>(null);
  const extra = extraState.startedAt === startedAt ? extraState.seconds : 0;

  useEffect(() => {
    if (startedAt == null) return;
    const total = duration + extra;
    const compute = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const left = Math.max(0, total - elapsed);
      setRemaining(left);
      if (left <= 0 && firedForRef.current !== startedAt) {
        firedForRef.current = startedAt;
        alarm();
      }
    };
    compute();
    const interval = setInterval(compute, 250);
    return () => clearInterval(interval);
  }, [startedAt, duration, extra]);

  if (startedAt == null) return null;

  const total = duration + extra;
  const done = remaining <= 0;
  const percent = Math.min(100, ((total - remaining) / total) * 100);
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);

  return (
    <div className="safe-fixed-inline fixed inset-x-0 bottom-[calc(98px+var(--safe-bottom))] z-30">
      <div className="mx-auto max-w-[440px]">
        <div
          className={`relative flex items-center gap-3 overflow-hidden rounded-[18px] border bg-[rgba(28,24,17,.96)] px-3 py-[11px] backdrop-blur-[14px] ${
            done ? "border-accent glow" : "border-line"
          }`}
        >
          <div className="relative flex-1">
            <div className="flex items-center justify-between">
              <span className="label">
                {done ? "Rest done · go" : "Resting"}
              </span>
              <span className={`display text-[22px] tracking-[0.03em] ${done ? "text-accent" : "text-text"}`}>
                {done
                  ? "00:00"
                  : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
              </span>
            </div>
            <div className="mt-[7px] h-[5px] overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-2 to-accent transition-[width] duration-200"
                style={{ width: `${done ? 100 : percent}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => {
              setExtraState({ startedAt, seconds: extra + 15 });
              tick();
            }}
            className="num shrink-0 rounded-[11px] border border-line bg-transparent px-[11px] py-[9px] text-[13px] font-semibold text-text-dim active:border-accent active:text-accent"
          >
            +15
          </button>
          <button
            onClick={onDismiss}
            className="num shrink-0 rounded-[11px] border-0 bg-surface-2 px-[13px] py-[11px] text-[10px] font-semibold uppercase tracking-[0.14em] text-text"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

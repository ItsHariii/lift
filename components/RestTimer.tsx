"use client";

import { useEffect, useRef, useState } from "react";
import { alarm, tick } from "@/lib/haptics";

export default function RestTimer({
  startedAt,
  duration,
  onDismiss,
}: {
  /** timestamp (ms) the current rest began, or null when idle */
  startedAt: number | null;
  duration: number;
  onDismiss: () => void;
}) {
  const [extra, setExtra] = useState(0);
  const [remaining, setRemaining] = useState(duration);
  const firedRef = useRef(false);

  useEffect(() => {
    setExtra(0);
    firedRef.current = false;
  }, [startedAt]);

  useEffect(() => {
    if (startedAt == null) return;
    const total = duration + extra;
    const compute = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const left = Math.max(0, total - elapsed);
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        alarm();
      }
    };
    compute();
    const iv = setInterval(compute, 250);
    return () => clearInterval(iv);
  }, [startedAt, duration, extra]);

  if (startedAt == null) return null;

  const total = duration + extra;
  const done = remaining <= 0;
  const pct = Math.min(100, ((total - remaining) / total) * 100);
  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60);

  return (
    <div className="fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 px-4">
      <div
        className={`mx-auto flex max-w-md items-center gap-3 overflow-hidden rounded-2xl border bg-surface/95 px-3 py-2.5 backdrop-blur-xl ${
          done ? "border-accent glow" : "border-line"
        }`}
      >
        <div className="relative flex-1">
          <div className="flex items-center justify-between">
            <span className="label">{done ? "Rest done — go" : "Resting"}</span>
            <span
              className={`num text-xl font-bold ${done ? "text-accent" : "text-text"}`}
            >
              {done ? "00:00" : `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`}
            </span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${done ? 100 : pct}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => {
            setExtra((e) => e + 15);
            tick();
          }}
          className="num shrink-0 rounded-lg border border-line px-2.5 py-2 text-sm font-semibold text-text-dim active:border-accent active:text-accent"
        >
          +15
        </button>
        <button
          onClick={onDismiss}
          className="label shrink-0 rounded-lg bg-surface-2 px-3 py-2.5 !text-[0.6rem] text-text active:bg-line"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export interface PRInfo {
  id: number;
  exercise: string;
  weight: string;
  unit: string;
  reps: number;
}

export default function PRToast({ pr }: { pr: PRInfo | null }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!pr) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, [pr]);

  if (!pr || !show) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <div className="animate-pop flex w-full max-w-md items-center gap-3 rounded-2xl border border-accent bg-surface px-4 py-3 glow">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-black">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M6 4h12v5a6 6 0 0 1-12 0V4Z" />
            <path d="M12 15v3M9 21h6M9 21a3 3 0 0 1 3-3 3 3 0 0 1 3 3" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="label !text-accent-dim">New personal record</div>
          <div className="truncate font-extrabold leading-tight">
            {pr.exercise}
          </div>
        </div>
        <div className="text-right">
          <div className="num text-2xl font-bold leading-none text-accent">
            {pr.weight}
            <span className="ml-1 text-xs text-text-dim">{pr.unit}</span>
          </div>
          <div className="num text-xs text-text-dim">× {pr.reps}</div>
        </div>
      </div>
    </div>
  );
}

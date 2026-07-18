"use client";

import { useEffect, useState, type CSSProperties } from "react";

export interface PRInfo {
  id: number;
  exercise: string;
  weight: string;
  unit: string;
  reps: number;
  /** formatted previous best weight, only set when the weight itself went up */
  prevBest?: string;
}

const confetti = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 41) % 100}%`,
  width: index % 4 === 0 ? 7 : 4,
  height: 7 + ((index * 13) % 8),
  color:
    index % 4 === 0
      ? "var(--gold)"
      : index % 4 === 1
        ? "var(--accent)"
        : index % 4 === 2
          ? "var(--gold-2)"
          : "var(--text)",
  delay: `${((index * 173) % 150) / 100}s`,
  duration: `${1.7 + ((index * 89) % 100) / 80}s`,
  drift: `${((index * 67) % 130) - 65}px`,
  spin: `${420 + ((index * 131) % 420)}deg`,
}));

export default function PRToast({ pr }: { pr: PRInfo | null }) {
  const [dismissedId, setDismissedId] = useState<number | null>(null);

  useEffect(() => {
    if (!pr) return;
    const timeout = setTimeout(() => setDismissedId(pr.id), 4600);
    return () => clearTimeout(timeout);
  }, [pr]);

  if (!pr || dismissedId === pr.id) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Dismiss personal record celebration"
      onClick={() => setDismissedId(pr.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          setDismissedId(pr.id);
        }
      }}
      className="safe-modal-padding fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-[rgba(8,6,3,.78)] backdrop-blur-[7px]"
    >
      {confetti.map((piece, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={
            {
              left: piece.left,
              width: piece.width,
              height: piece.height,
              background: piece.color,
              "--fall-delay": piece.delay,
              "--fall-duration": piece.duration,
              "--drift": piece.drift,
              "--spin": piece.spin,
            } as CSSProperties
          }
        />
      ))}
      <div className="relative w-full max-w-[330px] text-center animate-[stampIn_.52s_cubic-bezier(.22,1,.36,1)_both]">
        <span className="pointer-events-none absolute left-1/2 top-1/2 -ml-[110px] -mt-[110px] h-[220px] w-[220px] rounded-full border-2 border-gold animate-[ring_1.1s_ease-out_.1s_infinite]" />
        <span className="pointer-events-none absolute left-1/2 top-1/2 -ml-[110px] -mt-[110px] h-[220px] w-[220px] rounded-full border-2 border-accent animate-[ring_1.1s_ease-out_.45s_infinite]" />
        <div className="relative rounded-[26px] border-2 border-gold bg-gradient-to-b from-surface to-[#1a160f] px-6 pb-6 pt-[30px] shadow-[0_0_0_1px_var(--gold),0_0_44px_-8px_var(--gold-glow),0_26px_66px_-14px_rgba(0,0,0,.7)]">
          <div className="num flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-gold">
            <span className="h-px w-[22px] bg-gold-dim" />
            Personal Record
            <span className="h-px w-[22px] bg-gold-dim" />
          </div>
          <h2 className="mt-3 text-[19px] font-black uppercase tracking-[0.01em]">
            {pr.exercise}
          </h2>
          <div className="display pr-weight mt-3.5 text-[clamp(72px,21vw,92px)] leading-[0.8] tracking-[0.01em]">
            {pr.weight}
          </div>
          <div className="num mt-2 text-sm font-medium tracking-[0.1em] text-text-dim">
            {pr.unit} · {pr.reps} reps
          </div>
          {pr.prevBest && (
            <div className="num mt-1.5 text-[11px] tracking-[0.14em] text-text-faint">
              PREV BEST {pr.prevBest} {pr.unit} ↑
            </div>
          )}
          <div className="label mt-5">Tap to continue</div>
        </div>
      </div>
    </div>
  );
}

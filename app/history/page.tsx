"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getFinishedSummaries,
  currentStreak,
  buildHeatmap,
  type WorkoutSummary,
} from "@/lib/stats";
import { useSettings, useExerciseMap } from "@/lib/hooks";
import { fmtWeight } from "@/lib/units";
import PageHeader from "@/components/PageHeader";

export default function HistoryPage() {
  const summaries = useLiveQuery(() => getFinishedSummaries(), [], undefined);
  const settings = useSettings();
  const exMap = useExerciseMap();

  if (!summaries) {
    return <div className="pt-20 text-center text-text-faint">Loading…</div>;
  }

  const streak = currentStreak(summaries);
  const heat = buildHeatmap(summaries);
  const totalWorkouts = summaries.length;
  const totalVolume = summaries.reduce((a, s) => a + s.volumeKg, 0);
  const totalPRs = summaries.reduce((a, s) => a + s.prCount, 0);

  return (
    <div>
      <PageHeader title="History" />

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Streak" value={String(streak)} unit="days" accent />
        <Stat label="Sessions" value={String(totalWorkouts)} />
        <Stat label="PRs" value={String(totalPRs)} />
      </div>

      {/* heatmap */}
      <div className="card mt-3 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="label">Consistency</span>
          <span className="num text-xs text-text-faint">
            {Math.round(totalVolume).toLocaleString()} {settings.unit} · vol
          </span>
        </div>
        <div className="flex gap-[3px] overflow-x-auto no-scrollbar">
          {heat.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((cell) => (
                <div
                  key={cell.key}
                  title={`${cell.key}: ${cell.count} sets`}
                  className="h-[13px] w-[13px] rounded-[3px]"
                  style={{ background: heatColor(cell.count) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* session log */}
      <div className="mt-6 space-y-2.5">
        {summaries.length === 0 && (
          <p className="py-10 text-center text-text-faint">
            No finished workouts yet.
          </p>
        )}
        {summaries.map((s) => (
          <SessionRow key={s.workout.id} s={s} exMap={exMap} unit={settings.unit} />
        ))}
      </div>
    </div>
  );
}

function heatColor(count: number): string {
  if (count === 0) return "var(--surface-2)";
  if (count < 8) return "rgba(204,255,0,0.28)";
  if (count < 16) return "rgba(204,255,0,0.55)";
  if (count < 24) return "rgba(204,255,0,0.8)";
  return "var(--accent)";
}

function Stat({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div className="card px-3 py-3">
      <div className="label">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={`num text-2xl font-bold leading-none ${accent ? "text-accent" : ""}`}
        >
          {value}
        </span>
        {unit && <span className="label !text-[0.55rem]">{unit}</span>}
      </div>
    </div>
  );
}

function SessionRow({
  s,
  exMap,
  unit,
}: {
  s: WorkoutSummary;
  exMap?: Map<string, { name: string }>;
  unit: "kg" | "lb";
}) {
  const [open, setOpen] = useState(false);
  const d = new Date(s.workout.startedAt);
  const dateStr = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-surface-2"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold">{dateStr}</span>
            {s.prCount > 0 && (
              <span className="label !text-accent-dim">◆ {s.prCount} PR</span>
            )}
          </div>
          <div className="num mt-0.5 text-sm text-text-dim">
            {s.totalSets} sets · {Math.round(s.volumeKg).toLocaleString()} {unit}
            {s.durationMin != null && ` · ${s.durationMin}m`}
          </div>
        </div>
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 shrink-0 text-text-faint transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="space-y-3 border-t border-line px-4 py-3">
          {[...s.byExercise.entries()].map(([exId, sets]) => (
            <div key={exId}>
              <div className="mb-1 font-semibold">
                {exMap?.get(exId)?.name ?? "Exercise"}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sets.map((set) => (
                  <span
                    key={set.id}
                    className={`num rounded-md border px-2 py-1 text-xs ${
                      set.isPR
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-line text-text-dim"
                    }`}
                  >
                    {fmtWeight(set.weightKg, unit)}×{set.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

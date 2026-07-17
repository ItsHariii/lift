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
import { fmtWeight, fromKg } from "@/lib/units";
import PageHeader from "@/components/PageHeader";

export default function HistoryPage() {
  const summaries = useLiveQuery(() => getFinishedSummaries(), [], undefined);
  const settings = useSettings();
  const exMap = useExerciseMap();

  if (!summaries) {
    return <div className="pt-20 text-center text-text-faint">Loading...</div>;
  }

  const streak = currentStreak(summaries);
  const heat = buildHeatmap(summaries);
  const totalVolumeKg = summaries.reduce(
    (total, summary) => total + summary.volumeKg,
    0,
  );
  const totalPRs = summaries.reduce(
    (total, summary) => total + summary.prCount,
    0,
  );

  return (
    <div className="animate-rise">
      <PageHeader title="History" />

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Streak" value={String(streak)} unit="days" accent />
        <Stat label="Sessions" value={String(summaries.length)} />
        <Stat label="PRs" value={String(totalPRs)} />
      </div>

      <section className="mt-3 rounded-[18px] border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="label">Consistency</span>
          <span className="num text-[11px] text-text-faint">
            {Math.round(fromKg(totalVolumeKg, settings.unit)).toLocaleString()} {settings.unit} · vol
          </span>
        </div>
        <div className="flex gap-[3px] overflow-x-auto no-scrollbar">
          {heat.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-[3px]">
              {column.map((cell) => (
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
      </section>

      <div className="mt-[22px] flex flex-col gap-2.5">
        {summaries.length === 0 && (
          <p className="py-10 text-center text-text-faint">
            No finished workouts yet.
          </p>
        )}
        {summaries.map((summary) => (
          <SessionRow
            key={summary.workout.id}
            summary={summary}
            exMap={exMap}
            unit={settings.unit}
          />
        ))}
      </div>
    </div>
  );
}

function heatColor(count: number): string {
  if (count === 0) return "var(--surface-2)";
  if (count < 8) return "rgba(255,91,31,0.28)";
  if (count < 16) return "rgba(255,91,31,0.55)";
  if (count < 24) return "rgba(255,91,31,0.8)";
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
    <div className="rounded-2xl border border-line bg-surface px-3 py-3.5">
      <div className="label tracking-[0.16em]">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={`display text-[38px] leading-[0.8] ${accent ? "text-gold" : ""}`}>
          {value}
        </span>
        {unit && (
          <span className="num text-[9px] uppercase tracking-[0.14em] text-text-faint">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function SessionRow({
  summary,
  exMap,
  unit,
}: {
  summary: WorkoutSummary;
  exMap?: Map<string, { name: string }>;
  unit: "kg" | "lb";
}) {
  const [open, setOpen] = useState(false);
  const date = new Date(summary.workout.startedAt);
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="overflow-hidden rounded-[18px] border border-line bg-surface">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between border-0 bg-transparent p-4 text-left active:bg-surface-2"
      >
        <span>
          <span className="flex items-center gap-2.5">
            <span className="text-base font-extrabold">{dateLabel}</span>
            {summary.prCount > 0 && (
              <span className="num text-[10px] font-semibold tracking-[0.1em] text-gold">
                ◆ {summary.prCount} PR
              </span>
            )}
          </span>
          <span className="num mt-1 block text-xs text-text-dim">
            {summary.totalSets} sets · {Math.round(fromKg(summary.volumeKg, unit)).toLocaleString()} {unit}
            {summary.durationMin != null && ` · ${summary.durationMin}m`}
          </span>
        </span>
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
        <div className="flex flex-col gap-3 border-t border-line px-4 py-3.5">
          {[...summary.byExercise.entries()].map(([exerciseId, sets]) => (
            <div key={exerciseId}>
              <div className="mb-[7px] text-sm font-bold">
                {exMap?.get(exerciseId)?.name ?? "Exercise"}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sets.map((set) => (
                  <span
                    key={set.id}
                    className={`num relative rounded-lg border px-[9px] py-[5px] text-xs text-text-dim ${
                      set.isPR
                        ? "border-[rgba(242,181,60,.5)] bg-[rgba(242,181,60,.12)]"
                        : "border-line"
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
    </section>
  );
}

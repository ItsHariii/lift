"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getFinishedSummaries,
  currentStreak,
  bestStreak,
  buildHeatmap,
  heatMonthLabels,
  weekAggregate,
  weeklyMuscleVolume,
  type HeatCell,
  type WorkoutSummary,
} from "@/lib/stats";
import { useSettings, useExerciseMap } from "@/lib/hooks";
import { fmtWeight, fromKg, type Unit } from "@/lib/units";
import PageHeader from "@/components/PageHeader";
import { MuscleVolumeChart, GROUP_COLORS } from "@/components/ProgressChart";

type Filter = "all" | "pr" | "heavy";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pr", label: "PR days" },
  { key: "heavy", label: "Big sessions" },
];

export default function HistoryPage() {
  const summaries = useLiveQuery(() => getFinishedSummaries(), [], undefined);
  const settings = useSettings();
  const exMap = useExerciseMap();
  const [filter, setFilter] = useState<Filter>("all");

  const unit = settings.unit;

  const weekly = useMemo(
    () =>
      weeklyMuscleVolume(summaries ?? [], (id) =>
        exMap?.get(id)?.muscleGroup ?? "Other",
      ),
    [summaries, exMap],
  );

  const months = useMemo(() => {
    if (!summaries) return [];
    const average =
      summaries.reduce((total, s) => total + s.totalSets, 0) /
      Math.max(1, summaries.length);
    const kept = summaries.filter((summary) => {
      if (filter === "pr") return summary.prCount > 0;
      if (filter === "heavy") return summary.totalSets > average;
      return true;
    });
    return groupByMonth(kept);
  }, [summaries, filter]);

  if (!summaries) {
    return <div className="pt-20 text-center text-text-faint">Loading...</div>;
  }

  const thisWeek = weekAggregate(summaries, 0);
  const lastWeek = weekAggregate(summaries, 1);
  const heat = buildHeatmap(summaries);
  const strips = heatMonthLabels(heat);
  const hasWeeklyVolume = weekly.weeks.some((week) => week.totalKg > 0);
  const keptCount = months.reduce((total, m) => total + m.sessions.length, 0);

  const weeklyData = weekly.weeks.map((week) => {
    const row: Record<string, number | string> = { label: week.label };
    for (const group of weekly.groups) {
      row[group] = Math.round(fromKg(week.byGroup[group] ?? 0, unit));
    }
    return row;
  });

  return (
    <div className="animate-rise">
      <PageHeader title="History" />

      <WeekCard current={thisWeek} previous={lastWeek} unit={unit} />

      <section className="mt-3 rounded-[18px] border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="label">Consistency</span>
          <span className="num text-[11px] text-gold-dim">
            Streak {currentStreak(summaries)} · best {bestStreak(summaries)}
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <div className="flex w-max gap-[3px] pb-1.5">
            {strips.map((strip) => (
              <div
                key={strip.key}
                className="num text-[9px] uppercase tracking-[0.14em] text-text-faint"
                style={{ width: strip.columns * 16 - 3 }}
              >
                {strip.label}
              </div>
            ))}
          </div>
          <div className="flex w-max gap-[3px]">
            {heat.map((column) => (
              <div key={column[0].key} className="flex flex-col gap-[3px]">
                {column.map((cell) => (
                  <div
                    key={cell.key}
                    title={cell.future ? undefined : `${cell.key}: ${cell.count} sets`}
                    className="h-[13px] w-[13px] rounded-[3px]"
                    style={{ background: heatColor(cell) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="num mt-3 flex items-center gap-2.5 text-[9px] uppercase tracking-[0.12em] text-text-faint">
          <span className="flex items-center gap-1">
            Less
            {["var(--surface-2)", "rgba(255,91,31,.32)", "rgba(255,91,31,.58)", "var(--accent)"].map(
              (color) => (
                <span
                  key={color}
                  className="h-[9px] w-[9px] rounded-[2px]"
                  style={{ background: color }}
                />
              ),
            )}
            More
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-gold-dim">
            <span className="h-[9px] w-[9px] rounded-[2px] bg-gold" />
            PR day
          </span>
        </div>
      </section>

      {hasWeeklyVolume && (
        <section className="mt-3 rounded-[18px] border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="label">Weekly volume · muscle</span>
            <span className="num text-[11px] text-text-faint">{unit}</span>
          </div>
          <MuscleVolumeChart
            data={weeklyData}
            groups={weekly.groups}
            unit={unit}
          />
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
            {weekly.groups.map((group, index) => (
              <span
                key={group}
                className="num flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-text-dim"
              >
                <span
                  className="h-2 w-2 rounded-[3px]"
                  style={{
                    background: GROUP_COLORS[index % GROUP_COLORS.length],
                  }}
                />
                {group}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="mb-3 mt-6 flex items-center justify-between gap-2.5">
        <div className="flex gap-1 rounded-xl border border-line bg-bg-2 p-[3px]">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              onClick={() => setFilter(option.key)}
              aria-pressed={filter === option.key}
              className={`num rounded-[9px] px-3 py-[7px] text-[10px] font-semibold uppercase tracking-[0.14em] ${
                filter === option.key
                  ? "bg-accent text-[#1a1206]"
                  : "bg-transparent text-text-faint"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="num text-[10px] uppercase tracking-[0.14em] text-text-faint">
          {keptCount} of {summaries.length}
        </span>
      </div>

      {summaries.length === 0 ? (
        <p className="py-10 text-center text-text-faint">
          No finished workouts yet.
        </p>
      ) : keptCount === 0 ? (
        <p className="py-10 text-center text-text-faint">
          Nothing matches that filter.
        </p>
      ) : (
        <div className="flex flex-col gap-[18px]">
          {months.map((month) => (
            <section key={month.label}>
              <div className="mb-2.5 flex items-baseline justify-between border-b border-line pb-2">
                <h2 className="display text-xl uppercase tracking-[0.04em]">
                  {month.label}
                </h2>
                <span className="num text-[10px] uppercase tracking-[0.12em] text-text-faint">
                  {month.sessions.length} session
                  {month.sessions.length > 1 ? "s" : ""} ·{" "}
                  {Math.round(fromKg(month.volumeKg, unit)).toLocaleString()}{" "}
                  {unit}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {month.sessions.map((summary) => (
                  <SessionRow
                    key={summary.workout.id}
                    summary={summary}
                    exMap={exMap}
                    unit={unit}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function WeekCard({
  current,
  previous,
  unit,
}: {
  current: ReturnType<typeof weekAggregate>;
  previous: ReturnType<typeof weekAggregate>;
  unit: Unit;
}) {
  const delta =
    previous.volumeKg > 0
      ? Math.round((current.volumeKg / previous.volumeKg - 1) * 100)
      : null;
  const up = delta != null && delta >= 0;
  const range = `${fmtDay(current.start)} – ${fmtDay(
    new Date(current.start.getTime() + 6 * 86400000),
  )}`;

  const trained = new Set(
    current.list.map((s) => dayIndex(new Date(s.workout.startedAt), current.start)),
  );
  const prDays = new Set(
    current.list
      .filter((s) => s.prCount > 0)
      .map((s) => dayIndex(new Date(s.workout.startedAt), current.start)),
  );
  const todayIndex = dayIndex(new Date(), current.start);

  const stats = [
    {
      label: "Sessions",
      value: String(current.sessions),
      sub: `vs ${previous.sessions}`,
      gold: false,
    },
    {
      label: "Sets",
      value: String(current.sets),
      sub: `vs ${previous.sets}`,
      gold: false,
    },
    {
      label: "PRs",
      value: String(current.prs),
      sub: current.prs > 0 ? "earned" : "—",
      gold: current.prs > 0,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-line bg-surface px-[18px] pb-4 pt-[18px]">
      <div className="flex items-center justify-between">
        <span className="label tracking-[0.2em]">This week</span>
        <span className="num text-[10px] uppercase tracking-[0.14em] text-text-faint">
          {range}
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="display text-[clamp(44px,13vw,52px)] leading-[0.82] tabular-nums">
            {Math.round(fromKg(current.volumeKg, unit)).toLocaleString()}
          </span>
          <span className="num text-[11px] uppercase tracking-[0.14em] text-text-faint">
            {unit} moved
          </span>
        </div>
        <span
          className={`num mb-1 whitespace-nowrap rounded-lg px-[9px] py-[5px] text-xs font-semibold ${
            delta == null
              ? "bg-surface-2 text-text-faint"
              : up
                ? "bg-[rgba(242,181,60,.12)] text-gold"
                : "bg-surface-2 text-text-dim"
          }`}
        >
          {delta == null
            ? "first week"
            : `${up ? "▲" : "▼"} ${Math.abs(delta)}% vs last`}
        </span>
      </div>

      <div className="mt-4 flex gap-1.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
          const isPR = prDays.has(index);
          const didTrain = trained.has(index);
          const future = index > todayIndex;
          return (
            <div
              key={index}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span
                className={`num text-[9px] uppercase tracking-[0.1em] ${
                  index === todayIndex ? "text-accent" : "text-text-faint"
                }`}
              >
                {day}
              </span>
              <span
                className="num flex h-[30px] w-full items-center justify-center rounded-lg text-[10px] font-bold text-[#1a1206]"
                style={{
                  background: isPR
                    ? "var(--gold)"
                    : didTrain
                      ? "var(--accent)"
                      : future
                        ? "transparent"
                        : "var(--surface-2)",
                  boxShadow:
                    index === todayIndex
                      ? "inset 0 0 0 1.5px var(--accent)"
                      : future
                        ? "inset 0 0 0 1px var(--line)"
                        : undefined,
                }}
              >
                {isPR ? "◆" : ""}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3.5 flex items-center gap-3.5 border-t border-line pt-3.5">
        {stats.map((stat) => (
          <div key={stat.label} className="flex-1">
            <div className="num text-[9px] font-medium uppercase tracking-[0.16em] text-text-faint">
              {stat.label}
            </div>
            <div className="mt-[3px] flex items-baseline gap-1.5">
              <span
                className={`display text-[26px] leading-[0.9] ${
                  stat.gold ? "text-gold" : ""
                }`}
              >
                {stat.value}
              </span>
              <span className="num text-[10px] text-text-faint">
                {stat.sub}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SessionRow({
  summary,
  exMap,
  unit,
}: {
  summary: WorkoutSummary;
  exMap?: Map<string, { name: string }>;
  unit: Unit;
}) {
  const [open, setOpen] = useState(false);
  const date = new Date(summary.workout.startedAt);
  const names = [...summary.byExercise.keys()].map(
    (id) => exMap?.get(id)?.name ?? "Exercise",
  );
  const chips = names.slice(0, 3);
  if (names.length > 3) chips.push(`+${names.length - 3}`);

  return (
    <section className="overflow-hidden rounded-[18px] border border-line bg-surface">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between border-0 bg-transparent p-4 text-left active:bg-surface-2"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2.5">
            <span className="text-base font-extrabold">
              {date.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            {summary.prCount > 0 && (
              <span className="num text-[10px] font-semibold tracking-[0.1em] text-gold">
                ◆ {summary.prCount} PR
              </span>
            )}
          </span>
          <span className="num mt-1 block text-xs text-text-dim">
            {summary.totalSets} sets ·{" "}
            {Math.round(fromKg(summary.volumeKg, unit)).toLocaleString()} {unit}
            {summary.durationMin != null && ` · ${summary.durationMin}m`}
          </span>
          {chips.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="num rounded-[7px] bg-surface-2 px-2 py-1 text-[10px] uppercase tracking-[0.06em] text-text-dim"
                >
                  {chip}
                </span>
              ))}
            </span>
          )}
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

interface MonthGroup {
  label: string;
  sessions: WorkoutSummary[];
  volumeKg: number;
}

/** Summaries arrive newest-first, so the runs come out in display order. */
function groupByMonth(summaries: WorkoutSummary[]): MonthGroup[] {
  const months: MonthGroup[] = [];
  for (const summary of summaries) {
    const label = new Date(summary.workout.startedAt)
      .toLocaleDateString(undefined, { month: "long", year: "numeric" })
      .toUpperCase();
    const last = months[months.length - 1];
    if (last && last.label === label) {
      last.sessions.push(summary);
      last.volumeKg += summary.volumeKg;
    } else {
      months.push({ label, sessions: [summary], volumeKg: summary.volumeKg });
    }
  }
  return months;
}

function heatColor(cell: HeatCell): string {
  if (cell.future) return "transparent";
  if (cell.pr) return "var(--gold)";
  if (cell.count === 0) return "var(--surface-2)";
  if (cell.count < 7) return "rgba(255,91,31,.32)";
  if (cell.count < 10) return "rgba(255,91,31,.58)";
  if (cell.count < 13) return "rgba(255,91,31,.82)";
  return "var(--accent)";
}

function dayIndex(date: Date, weekStart: Date): number {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return Math.floor((day.getTime() - weekStart.getTime()) / 86400000);
}

function fmtDay(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

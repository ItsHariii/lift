"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  biggestMovers,
  dayKey,
  e1rm,
  exerciseIdsWithData,
  exerciseSeries,
  getFinishedSummaries,
  muscleBalance,
  prRecords,
  type ExercisePoint,
  type WorkoutSummary,
} from "@/lib/stats";
import { repMaxTable } from "@/lib/pr";
import { bodyweightSeries, logBodyweight } from "@/lib/bodyweight";
import { useSettings, useExerciseMap } from "@/lib/hooks";
import { clean, fmtWeight, fromKg, toKg, type Unit } from "@/lib/units";
import { confirmBuzz } from "@/lib/haptics";
import type { BodyweightEntry, RepMax } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import Sheet from "@/components/Sheet";
import Stepper from "@/components/Stepper";
import {
  WeightChart,
  VolumeChart,
  GROUP_COLORS,
} from "@/components/ProgressChart";

interface ExerciseOption {
  id: string;
  name: string;
  group: string;
}

type Tab = "overview" | "exercise";

export default function ProgressPage() {
  const settings = useSettings();
  const exMap = useExerciseMap();
  const ids = useLiveQuery(() => exerciseIdsWithData(), [], undefined);
  const summaries = useLiveQuery(() => getFinishedSummaries(), [], undefined);
  const bodyweights = useLiveQuery(() => bodyweightSeries(), [], undefined);
  const [tab, setTab] = useState<Tab>("overview");
  const [selected, setSelected] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const options = useMemo(() => {
    if (!ids || !exMap) return [];
    return ids
      .map((id) => {
        const exercise = exMap.get(id);
        return {
          id,
          name: exercise?.name ?? "Exercise",
          group: exercise?.muscleGroup ?? "Other",
        };
      })
      .sort(
        (a, b) =>
          a.group.localeCompare(b.group) || a.name.localeCompare(b.name),
      );
  }, [ids, exMap]);

  const currentSelected =
    selected && options.some((option) => option.id === selected)
      ? selected
      : (options[0]?.id ?? null);

  if (ids === undefined) {
    return <div className="pt-20 text-center text-text-faint">Loading...</div>;
  }

  const unit = settings.unit;

  if (options.length === 0) {
    return (
      <div className="animate-rise">
        <PageHeader title="Stats" />
        <div className="mb-3 rounded-[18px] border border-line bg-surface p-8 text-center text-text-faint">
          Log some sets and your progress charts show up here.
        </div>
        <BodyweightSection entries={bodyweights ?? []} unit={unit} />
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <PageHeader title="Stats" />

      <div className="mb-3.5 flex gap-1 rounded-[14px] border border-line bg-bg-2 p-[3px]">
        {(["overview", "exercise"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`display flex-1 rounded-[11px] py-[11px] text-[15px] uppercase tracking-[0.08em] ${
              tab === key
                ? "bg-accent text-[#1a1206]"
                : "bg-transparent text-text-faint"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <OverviewTab
          summaries={summaries}
          bodyweights={bodyweights ?? []}
          exMap={exMap}
          unit={unit}
          onPickExercise={(id) => {
            setSelected(id);
            setTab("exercise");
          }}
        />
      ) : (
        <ExerciseTab
          options={options}
          selectedId={currentSelected}
          bodyweights={bodyweights ?? []}
          unit={unit}
          onOpenPicker={() => setPickerOpen(true)}
        />
      )}

      <StatsExercisePicker
        open={pickerOpen}
        options={options}
        selectedId={currentSelected}
        onClose={() => setPickerOpen(false)}
        onSelect={(id) => {
          setSelected(id);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

/* ------------------------------- overview ------------------------------- */

function OverviewTab({
  summaries,
  bodyweights,
  exMap,
  unit,
  onPickExercise,
}: {
  summaries: WorkoutSummary[] | undefined;
  bodyweights: BodyweightEntry[];
  exMap?: Map<string, { name: string; muscleGroup: string }>;
  unit: Unit;
  onPickExercise: (id: string) => void;
}) {
  const nameOf = (id: string) => exMap?.get(id)?.name ?? "Exercise";

  const derived = useMemo(() => {
    if (!summaries) return null;
    return {
      movers: biggestMovers(summaries),
      records: prRecords(summaries),
      balance: muscleBalance(
        summaries,
        (id) => exMap?.get(id)?.muscleGroup ?? "Other",
      ),
      totalVolumeKg: summaries.reduce((total, s) => total + s.volumeKg, 0),
      totalPRs: summaries.reduce((total, s) => total + s.prCount, 0),
      trainingDays: new Set(
        summaries.map((s) => dayKey(s.workout.startedAt)),
      ).size,
    };
  }, [summaries, exMap]);

  if (!derived) {
    return <div className="pt-10 text-center text-text-faint">Loading...</div>;
  }

  const { movers, records, balance, totalVolumeKg, totalPRs, trainingDays } =
    derived;

  const lifetime = [
    {
      label: "Total volume",
      value: formatCompact(fromKg(totalVolumeKg, unit)),
      suffix: unit,
      gold: false,
    },
    {
      label: "Records set",
      value: String(totalPRs),
      suffix: "PRs",
      gold: true,
    },
    {
      label: "Sessions",
      value: String(summaries?.length ?? 0),
      suffix: "",
      gold: false,
    },
    {
      label: "Training days",
      value: String(trainingDays),
      suffix: "days",
      gold: false,
    },
  ];

  return (
    <div>
      {movers.length > 0 && (
        <section className="relative mb-3 overflow-hidden rounded-[20px] border border-line bg-surface px-[18px] pb-1.5 pt-[18px]">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="label tracking-[0.2em] text-gold-dim">
              The board · biggest movers
            </span>
            <span className="num text-[9px] uppercase tracking-[0.14em] text-text-faint">
              since day one
            </span>
          </div>
          {movers.map((mover, index) => (
            <button
              key={mover.exerciseId}
              onClick={() => onPickExercise(mover.exerciseId)}
              className="flex w-full items-center gap-3.5 border-t border-line bg-transparent px-0 py-[13px] text-left active:opacity-70"
            >
              <span className="display w-[22px] shrink-0 text-[22px] leading-none text-line-bright">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-extrabold">
                  {nameOf(mover.exerciseId)}
                </span>
                <span className="num mt-[3px] block text-[10px] uppercase tracking-[0.1em] text-text-faint">
                  {fmtWeight(mover.firstKg, unit)} →{" "}
                  {fmtWeight(mover.bestKg, unit)} {unit}
                </span>
              </span>
              <span className="display text-[32px] leading-[0.9] tabular-nums text-gold [text-shadow:0_0_22px_var(--gold-glow)]">
                {mover.pct >= 0 ? "+" : ""}
                {mover.pct}%
              </span>
            </button>
          ))}
        </section>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2">
        {lifetime.map((tile) => (
          <div
            key={tile.label}
            className="rounded-2xl border border-line bg-surface p-3.5"
          >
            <div className="num text-[9px] font-medium uppercase tracking-[0.16em] text-text-faint">
              {tile.label}
            </div>
            <div className="mt-[5px] flex items-baseline gap-1.5">
              <span
                className={`display text-[32px] leading-[0.85] ${tile.gold ? "text-gold" : ""}`}
              >
                {tile.value}
              </span>
              {tile.suffix && (
                <span className="num text-[9px] uppercase text-text-faint">
                  {tile.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {records.length > 0 && (
        <section className="mb-3 overflow-hidden rounded-[18px] border border-line bg-surface">
          <div className="flex items-center justify-between px-4 pb-2.5 pt-4">
            <span className="label tracking-[0.2em]">Record book</span>
            <span className="num text-[10px] uppercase tracking-[0.12em] text-gold-dim">
              {records.length} all time
            </span>
          </div>
          {records.slice(0, 6).map((record, index) => (
            <div
              key={`${record.exerciseId}-${record.date}-${index}`}
              className="flex items-center gap-3 border-t border-line px-4 py-[11px]"
            >
              <span className="text-[11px] text-gold">◆</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">
                  {nameOf(record.exerciseId)}
                </span>
                <span className="num mt-0.5 block text-[10px] uppercase tracking-[0.1em] text-text-faint">
                  {new Date(record.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {record.reps} reps
                </span>
              </span>
              <span className="text-right">
                <span className="display block text-xl leading-none text-gold">
                  {fmtWeight(record.weightKg, unit)}
                </span>
                <span className="num mt-[3px] block text-[10px] text-text-faint">
                  {record.prevKg > 0
                    ? `+${fmtWeight(record.weightKg - record.prevKg, unit)} ${unit}`
                    : "first"}
                </span>
              </span>
            </div>
          ))}
        </section>
      )}

      {balance.length > 0 && (
        <section className="mb-3 rounded-[18px] border border-line bg-surface p-4">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="label tracking-[0.2em]">Muscle balance</span>
            <span className="num text-[10px] uppercase tracking-[0.12em] text-text-faint">
              last 30 days
            </span>
          </div>
          <div className="flex flex-col gap-[11px]">
            {balance.map((slice, index) => (
              <div key={slice.group}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="num text-[10px] font-semibold uppercase tracking-[0.14em] text-text-dim">
                    {slice.group}
                  </span>
                  <span className="num text-[11px] text-text-faint">
                    {slice.pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${slice.pct}%`,
                      background: GROUP_COLORS[index % GROUP_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3.5 text-xs leading-[1.45] text-text-faint">
            {balance.length > 1
              ? `${balance[0].group} is carrying this block — ${balance[balance.length - 1].group} is the thinnest slice. Worth a plan that rebalances.`
              : "Log a few more sessions to see how your volume splits."}
          </p>
        </section>
      )}

      <BodyweightSection entries={bodyweights} unit={unit} />
    </div>
  );
}

/* ------------------------------- exercise ------------------------------- */

function ExerciseTab({
  options,
  selectedId,
  bodyweights,
  unit,
  onOpenPicker,
}: {
  options: ExerciseOption[];
  selectedId: string | null;
  bodyweights: BodyweightEntry[];
  unit: Unit;
  onOpenPicker: () => void;
}) {
  const selectedExercise = options.find((option) => option.id === selectedId);
  const series = useLiveQuery(
    () =>
      selectedId
        ? exerciseSeries(selectedId)
        : Promise.resolve([] as ExercisePoint[]),
    [selectedId],
    [] as ExercisePoint[],
  );
  const repMaxes = useLiveQuery(
    () =>
      selectedId ? repMaxTable(selectedId) : Promise.resolve([] as RepMax[]),
    [selectedId],
    [] as RepMax[],
  );

  const points = series ?? [];
  const records = repMaxes ?? [];
  const latestBw = bodyweights.length
    ? bodyweights[bodyweights.length - 1]
    : undefined;

  // A point is a PR when it beats every session before it.
  const prFlags: boolean[] = [];
  let running = 0;
  for (const point of points) {
    const isPR = point.bestWeightKg > running;
    if (isPR) running = point.bestWeightKg;
    prFlags.push(isPR);
  }

  const weightData = points.map((point) => ({
    label: point.label,
    value: Math.round(fromKg(point.bestWeightKg, unit)),
  }));
  const volumeData = points.map((point) => ({
    label: point.label,
    value: Math.round(fromKg(point.volumeKg, unit)),
  }));

  const sortedRecords = [...records].sort((a, b) => a.reps - b.reps);
  const topRecord = [...records].sort(
    (a, b) => b.bestWeightKg - a.bestWeightKg,
  )[0];
  const bestE1rm = records.length
    ? Math.max(...records.map((r) => e1rm(r.bestWeightKg, r.reps)))
    : 0;
  const recordMax = records.length
    ? Math.max(...records.map((r) => r.bestWeightKg))
    : 1;

  const totalSets = points.reduce((total, point) => total + point.setCount, 0);
  const totalVolumeKg = points.reduce(
    (total, point) => total + point.volumeKg,
    0,
  );

  // 30-day movement: today's best against where the lift stood a month ago.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const older = points.filter((p) => new Date(p.date) < cutoff);
  const recent = points.filter((p) => new Date(p.date) >= cutoff);
  const base = older.length
    ? older[older.length - 1].bestWeightKg
    : (points[0]?.bestWeightKg ?? 0);
  const nowBest = recent.length
    ? Math.max(...recent.map((p) => p.bestWeightKg))
    : base;
  const delta30 = nowBest - base;

  return (
    <div>
      <button
        onClick={onOpenPicker}
        className="mb-3 flex w-full items-center gap-3 rounded-[18px] border border-line bg-surface px-4 py-3.5 text-left active:border-accent"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border border-line bg-bg-2 text-accent">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="label block text-accent-dim">
            {selectedExercise?.group} · exercise
          </span>
          <span className="mt-0.5 block truncate text-[17px] font-extrabold">
            {selectedExercise?.name}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="num text-[10px] uppercase tracking-[0.14em] text-text-faint">
            Change
          </span>
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </button>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <Metric label="Sessions" value={String(points.length)} />
        <Metric label="Sets" value={String(totalSets)} />
        <Metric
          label="Volume"
          value={formatCompact(fromKg(totalVolumeKg, unit))}
          suffix={unit}
        />
      </div>

      {topRecord && (
        <section className="relative mb-3 overflow-hidden rounded-[20px] border border-line bg-surface px-[22px] pb-5 pt-[22px]">
          <span className="display pointer-events-none absolute -right-1.5 -top-4 text-[120px] leading-none text-[rgba(242,181,60,.07)]">
            ◆
          </span>
          <div className="relative">
            <div className="label text-gold-dim">
              Best lift · {selectedExercise?.name}
            </div>
            <div className="mt-2 flex items-baseline gap-2.5">
              <span className="display text-[clamp(54px,15vw,64px)] leading-[0.8] tabular-nums text-gold [text-shadow:0_0_26px_var(--gold-glow)]">
                {fmtWeight(topRecord.bestWeightKg, unit)}
              </span>
              <span className="num text-sm tracking-[0.1em] text-text-dim">
                {unit}
              </span>
              <span className="display text-[34px] leading-[0.8] text-text-dim">
                × {topRecord.reps}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {bestE1rm > 0 && (
                <span className="num rounded-lg border border-[rgba(242,181,60,.4)] px-[9px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
                  est. 1RM {fmtWeight(bestE1rm, unit)} {unit}
                </span>
              )}
              <span
                className={`num rounded-lg px-[9px] py-[5px] text-[11px] font-semibold ${
                  points.length < 2
                    ? "bg-surface-2 text-text-dim"
                    : delta30 > 0
                      ? "bg-[rgba(242,181,60,.12)] text-gold"
                      : delta30 < 0
                        ? "bg-[rgba(255,87,71,.1)] text-danger"
                        : "bg-surface-2 text-text-dim"
                }`}
              >
                {points.length < 2
                  ? "new lift"
                  : delta30 > 0
                    ? `▲ ${fmtWeight(delta30, unit)} ${unit} / 30d`
                    : delta30 < 0
                      ? `▼ ${fmtWeight(-delta30, unit)} ${unit} / 30d`
                      : "flat / 30d"}
              </span>
              {latestBw && (
                <span className="num text-[11px] uppercase tracking-[0.14em] text-text-faint">
                  {(topRecord.bestWeightKg / latestBw.weightKg).toFixed(2)}×
                  bodyweight
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      <ChartCard label="Best weight / session">
        {weightData.length > 1 ? (
          <>
            <WeightChart data={weightData} unit={unit} prFlags={prFlags} />
            <div className="num mt-1.5 flex justify-between text-[10px] text-text-faint">
              <span>{points[0].label}</span>
              <span>{points[points.length - 1].label}</span>
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-sm text-text-faint">
            One more session to draw a trend.
          </p>
        )}
      </ChartCard>

      <ChartCard label="Volume / session">
        {volumeData.length > 0 ? (
          <VolumeChart data={volumeData} unit={unit} prFlags={prFlags} />
        ) : (
          <p className="py-6 text-center text-sm text-text-faint">No data.</p>
        )}
      </ChartCard>

      <section className="mb-3 overflow-hidden rounded-[18px] border border-line bg-surface">
        <div className="label px-4 pb-1 pt-4 tracking-[0.2em]">
          Rep-max records
        </div>
        {sortedRecords.map((record) => {
          const isTop = record.key === topRecord?.key;
          return (
            <div
              key={record.key}
              className="flex items-center justify-between border-t border-line px-4 py-[11px]"
            >
              <span className="num w-16 shrink-0 text-[13px] text-text-dim">
                {record.reps} rep{record.reps > 1 ? "s" : ""}
              </span>
              <span className="mx-3 h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.round((record.bestWeightKg / recordMax) * 100)}%`,
                    background: isTop ? "var(--gold)" : "var(--accent-dim)",
                  }}
                />
              </span>
              <span
                className={`display shrink-0 text-[22px] tracking-[0.02em] ${isTop ? "text-gold" : "text-text"}`}
              >
                {fmtWeight(record.bestWeightKg, unit)} {unit}
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}

/* ------------------------------ bodyweight ------------------------------ */

function BodyweightSection({
  entries,
  unit,
}: {
  entries: BodyweightEntry[];
  unit: Unit;
}) {
  const latest = entries.length ? entries[entries.length - 1] : undefined;
  const [weight, setWeight] = useState(unit === "kg" ? 75 : 165);
  const [saved, setSaved] = useState(false);
  const primed = useRef(false);

  useEffect(() => {
    if (primed.current || !latest) return;
    primed.current = true;
    setWeight(clean(fromKg(latest.weightKg, unit)));
  }, [latest, unit]);

  const loggedToday = latest && dayKey(latest.date) === dayKey(new Date());

  const log = async () => {
    await logBodyweight(toKg(weight, unit));
    confirmBuzz();
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const chartData = entries.map((entry) => ({
    label: dayKey(entry.date).slice(5),
    value: clean(fromKg(entry.weightKg, unit)),
  }));

  // Trend against the last weigh-in older than 30 days.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const older = entries.filter((e) => new Date(e.date) < cutoff);
  const baseKg = older.length
    ? older[older.length - 1].weightKg
    : (entries[0]?.weightKg ?? 0);
  const delta = latest ? clean(fromKg(latest.weightKg - baseKg, unit)) : 0;

  return (
    <section className="rounded-[18px] border border-line bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="label tracking-[0.2em]">Bodyweight</span>
        {latest && (
          <span className="num text-[11px] text-text-faint">
            {loggedToday ? "logged today" : `last · ${dayKey(latest.date)}`}
          </span>
        )}
      </div>

      {latest && (
        <div className="mb-3 flex items-baseline gap-1.5">
          <span className="display text-[38px] leading-[0.85]">
            {fmtWeight(latest.weightKg, unit)}
          </span>
          <span className="num text-[10px] uppercase tracking-[0.14em] text-text-faint">
            {unit}
          </span>
          {entries.length > 1 && (
            <span
              className={`num ml-auto text-[11px] ${delta === 0 ? "text-text-faint" : "text-text-dim"}`}
            >
              {delta > 0 ? "▲ +" : delta < 0 ? "▼ −" : ""}
              {Math.abs(delta)} {unit} / 30d
            </span>
          )}
        </div>
      )}

      {chartData.length > 1 && (
        <div className="mb-3">
          <WeightChart
            data={chartData}
            unit={unit}
            color="#f2b53c"
            gradientId="bwfill"
            decimals={1}
            domain={["auto", "auto"]}
          />
        </div>
      )}

      <div className="flex items-end gap-2.5">
        <Stepper
          label={`Weigh-in · ${unit}`}
          value={weight}
          onChange={setWeight}
          step={unit === "kg" ? 0.1 : 0.2}
          decimals={1}
          min={1}
        />
        <button
          onClick={log}
          className="accent-button display shrink-0 rounded-[14px] border-0 px-5 py-3.5 text-lg tracking-[0.06em] active:scale-[0.99]"
        >
          {saved ? "SAVED" : "LOG"}
        </button>
      </div>
    </section>
  );
}

/* -------------------------------- picker -------------------------------- */

function StatsExercisePicker({
  open,
  options,
  selectedId,
  onClose,
  onSelect,
}: {
  open: boolean;
  options: ExerciseOption[];
  selectedId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const grouped = useMemo(() => {
    const groups = new Map<string, ExerciseOption[]>();
    for (const option of options) {
      if (
        deferredQuery &&
        !`${option.name} ${option.group}`.toLowerCase().includes(deferredQuery)
      ) {
        continue;
      }
      if (!groups.has(option.group)) groups.set(option.group, []);
      groups.get(option.group)?.push(option);
    }
    return groups;
  }, [deferredQuery, options]);

  const close = () => {
    setQuery("");
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} title="Choose Exercise">
      <div className="relative mb-4">
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-faint" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${options.length} tracked exercises`}
          className="w-full rounded-[14px] border border-line bg-bg-2 py-3.5 pl-12 pr-4 text-base text-text outline-none placeholder:text-text-faint focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-5">
        {[...grouped.entries()].map(([group, exercises]) => (
          <section key={group} className="[content-visibility:auto]">
            <div className="mb-2 flex items-center justify-between">
              <span className="label text-accent-dim">{group}</span>
              <span className="num text-[10px] text-text-faint">
                {exercises.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {exercises.map((exercise) => {
                const active = exercise.id === selectedId;
                return (
                  <button
                    key={exercise.id}
                    onClick={() => {
                      setQuery("");
                      onSelect(exercise.id);
                    }}
                    className={`flex min-h-12 items-center justify-between rounded-[14px] border px-4 py-3 text-left ${
                      active
                        ? "border-accent bg-[rgba(255,91,31,.1)] text-accent"
                        : "border-line bg-bg-2 text-text active:border-line-bright"
                    }`}
                  >
                    <span className="font-bold">{exercise.name}</span>
                    {active ? (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-text-faint" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        {grouped.size === 0 && (
          <p className="py-10 text-center text-text-faint">
            No tracked exercise matches &ldquo;{query.trim()}&rdquo;.
          </p>
        )}
      </div>
    </Sheet>
  );
}

/* --------------------------------- bits --------------------------------- */

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-3.5">
      <div className="label tracking-[0.14em]">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="display truncate text-[30px] leading-[0.85]">
          {value}
        </span>
        {suffix && (
          <span className="num text-[9px] uppercase text-text-faint">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-3 rounded-[18px] border border-line bg-surface p-4">
      <div className="label mb-2 tracking-[0.2em]">{label}</div>
      {children}
    </section>
  );
}

function formatCompact(value: number) {
  const rounded = Math.round(value);
  if (Math.abs(rounded) < 1_000) return rounded.toLocaleString();
  if (Math.abs(rounded) < 1_000_000) {
    return `${(rounded / 1_000).toFixed(rounded < 10_000 ? 1 : 0)}k`;
  }
  return `${(rounded / 1_000_000).toFixed(1)}m`;
}

"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  exerciseIdsWithData,
  exerciseSeries,
  type ExercisePoint,
} from "@/lib/stats";
import { repMaxTable } from "@/lib/pr";
import { useSettings, useExerciseMap } from "@/lib/hooks";
import { fmtWeight, fromKg } from "@/lib/units";
import type { RepMax } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import Sheet from "@/components/Sheet";
import { WeightChart, VolumeChart } from "@/components/ProgressChart";

interface ExerciseOption {
  id: string;
  name: string;
  group: string;
}

export default function ProgressPage() {
  const settings = useSettings();
  const exMap = useExerciseMap();
  const ids = useLiveQuery(() => exerciseIdsWithData(), [], undefined);
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
  const selectedExercise = options.find(
    (option) => option.id === currentSelected,
  );

  const series = useLiveQuery(
    () =>
      currentSelected
        ? exerciseSeries(currentSelected)
        : Promise.resolve([] as ExercisePoint[]),
    [currentSelected],
    [] as ExercisePoint[],
  );
  const repMaxes = useLiveQuery(
    () =>
      currentSelected
        ? repMaxTable(currentSelected)
        : Promise.resolve([] as RepMax[]),
    [currentSelected],
    [] as RepMax[],
  );

  if (ids === undefined) {
    return <div className="pt-20 text-center text-text-faint">Loading...</div>;
  }

  if (options.length === 0) {
    return (
      <div className="animate-rise">
        <PageHeader title="Stats" />
        <div className="rounded-[18px] border border-line bg-surface p-8 text-center text-text-faint">
          Log some sets and your progress charts show up here.
        </div>
      </div>
    );
  }

  const unit = settings.unit;
  const weightData = (series ?? []).map((point) => ({
    label: point.label,
    value: Math.round(fromKg(point.bestWeightKg, unit)),
  }));
  const volumeData = (series ?? []).map((point) => ({
    label: point.label,
    value: Math.round(fromKg(point.volumeKg, unit)),
  }));
  const sortedRecords = [...(repMaxes ?? [])].sort(
    (a, b) => a.reps - b.reps,
  );
  const topRecord = [...(repMaxes ?? [])].sort(
    (a, b) => b.bestWeightKg - a.bestWeightKg,
  )[0];
  const totalSets = (series ?? []).reduce(
    (total, point) => total + point.setCount,
    0,
  );
  const totalVolumeKg = (series ?? []).reduce(
    (total, point) => total + point.volumeKg,
    0,
  );

  return (
    <div className="animate-rise">
      <PageHeader title="Stats" />

      <button
        onClick={() => setPickerOpen(true)}
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
        <Metric label="Sessions" value={String(series?.length ?? 0)} />
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
              <span className="display text-[clamp(54px,15vw,64px)] leading-[0.8] text-gold [text-shadow:0_0_26px_var(--gold-glow)]">
                {fmtWeight(topRecord.bestWeightKg, unit)}
              </span>
              <span className="num text-sm tracking-[0.1em] text-text-dim">
                {unit}
              </span>
              <span className="display text-[34px] leading-[0.8] text-text-dim">
                × {topRecord.reps}
              </span>
            </div>
          </div>
        </section>
      )}

      <ChartCard label="Best weight / session">
        {weightData.length > 1 ? (
          <WeightChart data={weightData} unit={unit} />
        ) : (
          <p className="py-6 text-center text-sm text-text-faint">
            One more session to draw a trend.
          </p>
        )}
      </ChartCard>

      <ChartCard label="Volume / session">
        {volumeData.length > 0 ? (
          <VolumeChart data={volumeData} unit={unit} />
        ) : (
          <p className="py-6 text-center text-sm text-text-faint">No data.</p>
        )}
      </ChartCard>

      <section className="overflow-hidden rounded-[18px] border border-line bg-surface">
        <div className="label px-4 pb-1 pt-4">Rep-max records</div>
        {sortedRecords.map((record) => (
          <div
            key={record.key}
            className="flex items-center justify-between border-t border-line px-4 py-[11px]"
          >
            <span className="num text-[13px] text-text-dim">
              {record.reps} rep{record.reps > 1 ? "s" : ""}
            </span>
            <span
              className={`display text-[22px] tracking-[0.02em] ${record.key === topRecord?.key ? "text-gold" : "text-text"}`}
            >
              {fmtWeight(record.bestWeightKg, unit)} {unit}
            </span>
          </div>
        ))}
      </section>

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
      <div className="label mb-2">{label}</div>
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

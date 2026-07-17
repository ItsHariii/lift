"use client";

import { useMemo, useState } from "react";
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
import { WeightChart, VolumeChart } from "@/components/ProgressChart";

export default function ProgressPage() {
  const settings = useSettings();
  const exMap = useExerciseMap();
  const ids = useLiveQuery(() => exerciseIdsWithData(), [], undefined);
  const [selected, setSelected] = useState<string | null>(null);

  const options = useMemo(() => {
    if (!ids || !exMap) return [];
    return ids
      .map((id) => ({ id, name: exMap.get(id)?.name ?? "Exercise" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ids, exMap]);

  const currentSelected =
    selected && options.some((option) => option.id === selected)
      ? selected
      : (options[0]?.id ?? null);

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
  const selectedName = options.find(
    (option) => option.id === currentSelected,
  )?.name;
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

  return (
    <div className="animate-rise">
      <PageHeader title="Stats" />

      <div className="-mx-[18px] mb-4 flex gap-2 overflow-x-auto px-[18px] no-scrollbar">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`shrink-0 rounded-full border px-4 py-[9px] text-[13px] font-bold ${
              currentSelected === option.id
                ? "border-accent bg-accent text-[#1a1206]"
                : "border-line bg-transparent text-text-dim active:border-line-bright"
            }`}
          >
            {option.name}
          </button>
        ))}
      </div>

      {topRecord && (
        <section className="relative mb-3 overflow-hidden rounded-[20px] border border-line bg-surface px-[22px] pb-5 pt-[22px]">
          <span className="display pointer-events-none absolute -right-1.5 -top-4 text-[120px] leading-none text-[rgba(242,181,60,.07)]">
            ◆
          </span>
          <div className="relative">
            <div className="label text-gold-dim">
              Best lift · {selectedName}
            </div>
            <div className="mt-2 flex items-baseline gap-2.5">
              <span className="display text-[64px] leading-[0.8] text-gold [text-shadow:0_0_26px_var(--gold-glow)]">
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

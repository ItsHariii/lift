"use client";

import { useEffect, useMemo, useState } from "react";
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
      .map((id) => ({ id, name: exMap.get(id)?.name ?? "?" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ids, exMap]);

  useEffect(() => {
    if (!selected && options.length) setSelected(options[0].id);
  }, [options, selected]);

  const series = useLiveQuery(
    () =>
      selected ? exerciseSeries(selected) : Promise.resolve([] as ExercisePoint[]),
    [selected],
    [] as ExercisePoint[],
  );
  const repMaxes = useLiveQuery(
    () => (selected ? repMaxTable(selected) : Promise.resolve([] as RepMax[])),
    [selected],
    [] as RepMax[],
  );

  if (ids === undefined) {
    return <div className="pt-20 text-center text-text-faint">Loading…</div>;
  }

  if (options.length === 0) {
    return (
      <div>
        <PageHeader title="Stats" />
        <div className="card mt-4 p-8 text-center text-text-faint">
          Log some sets and your progress charts show up here.
        </div>
      </div>
    );
  }

  const u = settings.unit;
  const weightData = (series ?? []).map((p) => ({
    label: p.label,
    value: Math.round(fromKg(p.bestWeightKg, u)),
  }));
  const volumeData = (series ?? []).map((p) => ({
    label: p.label,
    value: Math.round(fromKg(p.volumeKg, u)),
  }));

  const topRm =
    (repMaxes ?? []).length > 0
      ? [...repMaxes!].sort((a, b) => b.bestWeightKg - a.bestWeightKg)[0]
      : undefined;

  return (
    <div>
      <PageHeader title="Stats" />

      {/* exercise selector */}
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar px-4">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => setSelected(o.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              selected === o.id
                ? "border-accent bg-accent text-black"
                : "border-line text-text-dim active:border-line-bright"
            }`}
          >
            {o.name}
          </button>
        ))}
      </div>

      {/* headline PR */}
      {topRm && (
        <div className="card relative mb-3 overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-accent/10 blur-2xl" />
          <div className="label">Best lift</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num text-5xl font-bold text-accent">
              {fmtWeight(topRm.bestWeightKg, u)}
            </span>
            <span className="label !text-sm">{u}</span>
            <span className="num text-2xl font-bold text-text-dim">
              × {topRm.reps}
            </span>
          </div>
        </div>
      )}

      {/* best-weight trend */}
      <div className="card mb-3 p-4">
        <div className="label mb-2">Best weight / session</div>
        {weightData.length > 1 ? (
          <WeightChart data={weightData} unit={u} />
        ) : (
          <p className="py-6 text-center text-sm text-text-faint">
            One more session to draw a trend.
          </p>
        )}
      </div>

      {/* volume */}
      <div className="card mb-3 p-4">
        <div className="label mb-2">Volume / session</div>
        {volumeData.length > 0 ? (
          <VolumeChart data={volumeData} unit={u} />
        ) : (
          <p className="py-6 text-center text-sm text-text-faint">No data.</p>
        )}
      </div>

      {/* rep-max table */}
      <div className="card overflow-hidden">
        <div className="label px-4 pt-4">Rep-max records</div>
        <div className="mt-2 divide-y divide-line">
          {[...(repMaxes ?? [])]
            .sort((a, b) => a.reps - b.reps)
            .map((rm) => (
              <div
                key={rm.key}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <span className="num text-sm text-text-dim">
                  {rm.reps} rep{rm.reps > 1 ? "s" : ""}
                </span>
                <span className="num text-lg font-bold">
                  {fmtWeight(rm.bestWeightKg, u)}
                  <span className="ml-1 text-xs text-text-dim">{u}</span>
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

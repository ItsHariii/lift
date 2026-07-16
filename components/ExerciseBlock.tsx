"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { logSet, deleteSet, lastSetFor } from "@/lib/pr";
import {
  fromKg,
  toKg,
  fmtWeight,
  step as unitStep,
  clean,
  type Unit,
} from "@/lib/units";
import { confirmBuzz, celebrate } from "@/lib/haptics";
import Stepper from "./Stepper";
import type { PRInfo } from "./PRToast";

export default function ExerciseBlock({
  workoutId,
  exerciseId,
  name,
  group,
  unit,
  onLogged,
  onRemove,
}: {
  workoutId: string;
  exerciseId: string;
  name: string;
  group: string;
  unit: Unit;
  onLogged: (pr: PRInfo | null) => void;
  onRemove: () => void;
}) {
  const sets = useLiveQuery(
    () =>
      db.sets
        .where("workoutId")
        .equals(workoutId)
        .filter((s) => s.exerciseId === exerciseId)
        .toArray()
        .then((xs) => xs.sort((a, b) => a.createdAt.localeCompare(b.createdAt))),
    [workoutId, exerciseId],
    [],
  );

  const [weight, setWeight] = useState<number>(unit === "kg" ? 20 : 45);
  const [reps, setReps] = useState<number>(8);
  const primed = useRef(false);

  // prefill from the most recent time this exercise was performed
  useEffect(() => {
    if (primed.current) return;
    primed.current = true;
    lastSetFor(exerciseId).then((last) => {
      if (last) {
        setWeight(clean(fromKg(last.weightKg, unit)));
        setReps(last.reps);
      }
    });
  }, [exerciseId, unit]);

  const doLog = async () => {
    const weightKg = toKg(weight, unit);
    const res = await logSet({ workoutId, exerciseId, weightKg, reps, unit });
    if (res.isPR) {
      celebrate();
      onLogged({
        id: Date.now(),
        exercise: name,
        weight: fmtWeight(weightKg, unit),
        unit,
        reps,
      });
    } else {
      confirmBuzz();
      onLogged(null);
    }
  };

  const prCount = (sets ?? []).filter((s) => s.isPR).length;

  return (
    <div className="card animate-rise overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3.5">
        <div className="min-w-0">
          <div className="label">{group}</div>
          <h3 className="truncate text-lg font-extrabold tracking-tight">{name}</h3>
        </div>
        <button
          onClick={onRemove}
          aria-label={`remove ${name}`}
          className="ml-2 shrink-0 rounded-lg px-2 py-1 text-text-faint active:text-danger"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
          </svg>
        </button>
      </div>

      {/* logged sets */}
      {(sets?.length ?? 0) > 0 && (
        <div className="mt-3 space-y-1 px-4">
          {sets!.map((s, i) => (
            <div
              key={s.id}
              className={`group flex items-center gap-3 rounded-lg px-2 py-1.5 ${
                s.isPR ? "bg-accent/10" : ""
              }`}
            >
              <span className="num w-6 text-sm font-semibold text-text-faint">
                {i + 1}
              </span>
              <span className="num flex-1 text-base font-semibold">
                {fmtWeight(s.weightKg, unit)}
                <span className="ml-1 text-xs text-text-dim">{unit}</span>
                <span className="mx-2 text-text-faint">×</span>
                {s.reps}
              </span>
              {s.isPR && (
                <span className="label !text-accent-dim flex items-center gap-1">
                  ◆ PR
                </span>
              )}
              <button
                onClick={() => deleteSet(s.id)}
                aria-label="delete set"
                className="text-text-faint active:text-danger"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* input row */}
      <div className="mt-3 flex items-end gap-2.5 px-4">
        <Stepper
          label={`Weight (${unit})`}
          value={weight}
          onChange={setWeight}
          step={unitStep(unit)}
          decimals={1}
        />
        <Stepper label="Reps" value={reps} onChange={setReps} step={1} min={1} />
      </div>

      <button
        onClick={doLog}
        className="mt-3 mb-3 mx-4 w-[calc(100%-2rem)] rounded-xl bg-accent py-3.5 text-center font-extrabold uppercase tracking-wide text-black active:scale-[0.99]"
      >
        Log Set{prCount > 0 ? "  ·  " : ""}
        {prCount > 0 && <span className="text-black/70">{prCount} PR</span>}
      </button>
    </div>
  );
}

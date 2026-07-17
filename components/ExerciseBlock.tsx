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
        .filter((set) => set.exerciseId === exerciseId)
        .toArray()
        .then((items) =>
          items.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        ),
    [workoutId, exerciseId],
    [],
  );
  const [weight, setWeight] = useState(unit === "kg" ? 20 : 45);
  const [reps, setReps] = useState(8);
  const primed = useRef(false);

  useEffect(() => {
    if (primed.current) return;
    primed.current = true;
    lastSetFor(exerciseId).then((last) => {
      if (!last) return;
      setWeight(clean(fromKg(last.weightKg, unit)));
      setReps(last.reps);
    });
  }, [exerciseId, unit]);

  const doLog = async () => {
    const weightKg = toKg(weight, unit);
    const result = await logSet({
      workoutId,
      exerciseId,
      weightKg,
      reps,
      unit,
    });
    if (result.isPR) {
      celebrate();
      onLogged({
        id: Date.now(),
        exercise: name,
        weight: fmtWeight(weightKg, unit),
        unit,
        reps,
      });
      return;
    }
    confirmBuzz();
    onLogged(null);
  };

  return (
    <section className="animate-rise overflow-hidden rounded-[20px] border border-line bg-surface">
      <div className="flex items-start justify-between px-4 pt-[15px]">
        <div className="min-w-0">
          <div className="label tracking-[0.2em] text-accent-dim">{group}</div>
          <h3 className="mt-0.5 truncate text-xl font-extrabold leading-[1.1] tracking-[-0.01em]">
            {name}
          </h3>
        </div>
        <button
          onClick={onRemove}
          aria-label={`remove ${name}`}
          className="ml-2 shrink-0 border-0 bg-transparent p-1 text-text-faint active:text-danger"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
          </svg>
        </button>
      </div>

      {(sets?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-col gap-0.5 px-3">
          {sets?.map((set, index) => (
            <div
              key={set.id}
              className={`relative flex items-center gap-3 rounded-[10px] px-2.5 py-[9px] ${
                set.isPR
                  ? "border border-[rgba(242,181,60,.32)] bg-[rgba(242,181,60,.10)]"
                  : "border border-transparent"
              }`}
            >
              <span className="num w-5 text-xs font-semibold text-text-faint">
                {index + 1}
              </span>
              <span className="num flex-1 text-base font-semibold tabular-nums">
                {fmtWeight(set.weightKg, unit)}
                <span className="mx-[9px] text-text-faint">×</span>
                {set.reps}
              </span>
              {set.isPR && (
                <span className="num text-[10px] font-semibold tracking-[0.14em] text-gold">
                  ◆ PR
                </span>
              )}
              <button
                onClick={() => deleteSet(set.id)}
                aria-label="delete set"
                className="border-0 bg-transparent p-0.5 text-text-faint active:text-danger"
              >
                <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2.5 px-4">
        <Stepper
          label={`Weight · ${unit}`}
          value={weight}
          onChange={setWeight}
          step={unitStep(unit)}
          decimals={1}
        />
        <Stepper label="Reps" value={reps} onChange={setReps} step={1} min={1} />
      </div>

      <button
        onClick={doLog}
        className="accent-button display mx-4 mb-4 mt-3.5 w-[calc(100%-2rem)] rounded-[14px] border-0 py-3.5 text-xl tracking-[0.06em] active:scale-[0.99]"
      >
        LOG SET
      </button>
    </section>
  );
}

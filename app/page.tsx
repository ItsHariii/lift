"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useSettings, useExerciseMap } from "@/lib/hooks";
import {
  getActiveWorkout,
  startWorkout,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  finishWorkout,
  discardWorkout,
} from "@/lib/workout";
import { confirmBuzz } from "@/lib/haptics";
import ExerciseBlock from "@/components/ExerciseBlock";
import ExercisePicker from "@/components/ExercisePicker";
import RestTimer from "@/components/RestTimer";
import PRToast, { type PRInfo } from "@/components/PRToast";

function useElapsed(startedAt?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  if (!startedAt) return "00:00";
  const s = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
}

export default function LogPage() {
  const settings = useSettings();
  const exMap = useExerciseMap();
  const active = useLiveQuery(() => getActiveWorkout(), [], undefined);
  const elapsed = useElapsed(active?.startedAt);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [restStart, setRestStart] = useState<number | null>(null);
  const [pr, setPr] = useState<PRInfo | null>(null);

  const totalSets = useLiveQuery(
    () => (active ? db.sets.where("workoutId").equals(active.id).count() : 0),
    [active?.id],
    0,
  );

  const exerciseIds = useMemo(() => active?.exerciseIds ?? [], [active]);

  const onLogged = (info: PRInfo | null) => {
    if (info) setPr(info);
    if (settings.autoRest) setRestStart(Date.now());
  };

  const start = async () => {
    confirmBuzz();
    await startWorkout();
  };

  const finish = async () => {
    if (!active) return;
    await finishWorkout(active.id);
    setRestStart(null);
  };

  const discard = async () => {
    if (!active) return;
    if (!confirm("Discard this workout and all its sets?")) return;
    await discardWorkout(active.id);
    setRestStart(null);
  };

  if (active === undefined) {
    return <div className="pt-20 text-center text-text-faint">Loading…</div>;
  }

  if (!active) {
    return (
      <div className="animate-rise">
        <Header title="LIFT" subtitle="Ready when you are" />
        <div className="mt-8 card relative overflow-hidden p-6 text-center">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
          <div className="label">No active session</div>
          <p className="mt-2 text-2xl font-extrabold leading-tight">
            Log your first set
            <br />
            <span className="text-text-dim">and start the clock.</span>
          </p>
          <button
            onClick={start}
            className="mt-6 w-full rounded-2xl bg-accent py-4 text-lg font-extrabold uppercase tracking-wide text-black active:scale-[0.99]"
          >
            Start Training
          </button>
          <p className="mt-3 text-sm text-text-faint">
            Or begin from a saved plan in{" "}
            <span className="text-text-dim">Plans</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PRToast pr={pr} />

      <div className="sticky top-0 z-20 -mx-4 mb-3 border-b border-line bg-bg/85 px-4 pb-3 pt-1 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="label">
              {active.routineName ?? "Freestyle"} · {totalSets} sets
            </div>
            <div className="num text-3xl font-bold leading-none">{elapsed}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={discard}
              className="label rounded-xl border border-line px-3 py-2.5 text-text-dim active:border-danger active:text-danger"
            >
              Discard
            </button>
            <button
              onClick={finish}
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-black active:scale-95"
            >
              Finish
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {exerciseIds.map((id) => {
          const ex = exMap?.get(id);
          if (!ex) return null;
          return (
            <ExerciseBlock
              key={id}
              workoutId={active.id}
              exerciseId={id}
              name={ex.name}
              group={ex.muscleGroup}
              unit={settings.unit}
              onLogged={onLogged}
              onRemove={() => removeExerciseFromWorkout(active.id, id)}
            />
          );
        })}
      </div>

      <button
        onClick={() => setPickerOpen(true)}
        className="mt-3 w-full rounded-2xl border border-dashed border-line-bright py-4 text-center font-semibold text-text-dim active:border-accent active:text-accent"
      >
        ＋ Add Exercise
      </button>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(id) => addExerciseToWorkout(active.id, id)}
        excludeIds={exerciseIds}
      />

      <RestTimer
        startedAt={restStart}
        duration={settings.restSeconds}
        onDismiss={() => setRestStart(null)}
      />
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h1 className="text-4xl font-black tracking-tighter">{title}</h1>
      <span className="label">{subtitle}</span>
    </div>
  );
}

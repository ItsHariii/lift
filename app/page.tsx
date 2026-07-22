"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Routine, type Workout } from "@/lib/db";
import { useSettings, useExerciseMap } from "@/lib/hooks";
import {
  getActiveWorkout,
  startWorkout,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  finishWorkout,
  discardWorkout,
} from "@/lib/workout";
import {
  captureLocation,
  distanceM,
  LEAVE_RADIUS_M,
  MAX_SESSION_MS,
  GEO_POLL_MS,
} from "@/lib/geo";
import { confirmBuzz } from "@/lib/haptics";
import ExerciseBlock from "@/components/ExerciseBlock";
import ExercisePicker from "@/components/ExercisePicker";
import RestTimer from "@/components/RestTimer";
import PRToast, { type PRInfo } from "@/components/PRToast";

function useElapsed(startedAt?: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!startedAt) return "00:00";
  const seconds = Math.max(
    0,
    Math.floor((now - new Date(startedAt).getTime()) / 1000),
  );
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(remainder)}`
    : `${pad(minutes)}:${pad(remainder)}`;
}

/**
 * Auto-finish the active workout when the user leaves the start location
 * (checked every 10 min while the app is open, and on reopen) or after a 3h
 * cap. Location checks only run while the app is foreground — browsers can't
 * read GPS in the background.
 */
function useAutoEnd(active: Workout | null | undefined, enabled: boolean) {
  useEffect(() => {
    if (!active) return;
    const workoutId = active.id;
    const startedAt = new Date(active.startedAt).getTime();
    const start =
      active.startLat != null && active.startLng != null
        ? { lat: active.startLat, lng: active.startLng }
        : null;
    let cancelled = false;

    const check = async () => {
      if (cancelled) return;
      // 3h cap — fires regardless of location/permission
      if (Date.now() - startedAt > MAX_SESSION_MS) {
        await finishWorkout(workoutId);
        return;
      }
      if (!enabled || !start) return;
      const here = await captureLocation();
      if (cancelled || !here) return;
      if (distanceM(start, here) > LEAVE_RADIUS_M) {
        await finishWorkout(workoutId);
      }
    };

    check();
    const interval = setInterval(check, GEO_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, enabled]);
}

export default function LogPage() {
  const settings = useSettings();
  const exMap = useExerciseMap();
  const active = useLiveQuery(() => getActiveWorkout(), [], undefined);
  const routines = useLiveQuery(
    () => db.routines.orderBy("createdAt").reverse().toArray(),
    [],
    undefined,
  );
  const elapsed = useElapsed(active?.startedAt);
  useAutoEnd(active, settings.autoEndOnLeave ?? false);
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

  const startFreestyle = async () => {
    confirmBuzz();
    const loc = settings.autoEndOnLeave ? await captureLocation() : null;
    await startWorkout(
      loc ? { startLat: loc.lat, startLng: loc.lng } : undefined,
    );
  };

  const startRoutine = async (routine: Routine) => {
    confirmBuzz();
    const loc = settings.autoEndOnLeave ? await captureLocation() : null;
    await startWorkout({
      routineId: routine.id,
      routineName: routine.name,
      exerciseIds: routine.exerciseIds,
      ...(loc ? { startLat: loc.lat, startLng: loc.lng } : {}),
    });
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
    return <div className="pt-20 text-center text-text-faint">Loading...</div>;
  }

  if (!active) {
    return (
      <div className="animate-rise">
        <div className="mb-[30px] flex items-end justify-between">
          <div>
            <h1 className="display text-[clamp(58px,15.3vw,66px)] leading-[0.8] tracking-[0.005em]">
              LIFT
            </h1>
            <div className="mt-3 h-1.5 w-[104px] rounded-sm bg-accent" />
          </div>
          <div className="num text-right text-[10px] leading-[1.7] tracking-[0.24em] text-text-faint">
            EST · IRON
            <br />
            CLUB · 01
          </div>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 pb-[26px] pt-[30px]">
          <span className="display pointer-events-none absolute -right-3.5 -top-[26px] select-none text-[150px] leading-none text-surface-2">
            01
          </span>
          <div className="relative">
            <div className="label">No active session</div>
            <h2 className="display mt-3 text-[clamp(46px,12vw,52px)] leading-[0.86]">
              TIME TO
              <br />
              <span className="text-accent">WORK.</span>
            </h2>
            <p className="mt-4 max-w-[32ch] text-[15px] leading-6 text-text-dim">
              Log your first set and start the clock. Every rep goes on the
              record.
            </p>
            <button
              onClick={startFreestyle}
              className="accent-button display mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border-0 px-4 py-[18px] text-[23px] tracking-[0.04em] active:scale-[0.99]"
            >
              START TRAINING <span className="text-[26px]">›</span>
            </button>
          </div>
        </section>

        <div className="mt-3.5 flex items-center gap-2.5 text-text-faint">
          <span className="h-px flex-1 bg-line" />
          <span className="label">or launch a plan</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="mt-3.5 flex flex-col gap-2.5">
          {(routines ?? []).map((routine) => (
            <button
              key={routine.id}
              onClick={() => startRoutine(routine)}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5 text-left active:border-accent-dim"
            >
              <span>
                <span className="block text-base font-extrabold">
                  {routine.name}
                </span>
                <span className="label mt-0.5 block tracking-[0.16em]">
                  {routine.exerciseIds.length} exercises
                </span>
              </span>
              <span className="display text-[22px] text-accent">›</span>
            </button>
          ))}
          {routines?.length === 0 && (
            <p className="py-2 text-center text-sm text-text-faint">
              Build a reusable workout from Plans.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PRToast pr={pr} />

      <header className="app-bleed active-session-header sticky z-20 mb-3.5 border-b border-line bg-[rgba(19,17,12,.86)] pb-[13px] pt-4 backdrop-blur-2xl">
        <div className="flex items-end justify-between">
          <div>
            <div className="label tracking-[0.18em]">
              {active.routineName ?? "Freestyle"} · {totalSets} sets
            </div>
            <div className="display text-[clamp(40px,10.7vw,46px)] leading-[0.82] tracking-[0.02em] tabular-nums">
              {elapsed}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={discard}
              className="label rounded-xl border border-line bg-transparent px-3 py-[11px] font-semibold tracking-[0.14em] text-text-dim active:border-danger active:text-danger"
            >
              Discard
            </button>
            <button
              onClick={finish}
              className="display rounded-xl border-0 bg-accent px-[18px] text-[15px] tracking-[0.06em] text-[#1a1206] active:scale-95"
            >
              FINISH
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {exerciseIds.map((id) => {
          const exercise = exMap?.get(id);
          if (!exercise) return null;
          return (
            <ExerciseBlock
              key={id}
              workoutId={active.id}
              exerciseId={id}
              name={exercise.name}
              group={exercise.muscleGroup}
              unit={settings.unit}
              defaultWeightKg={exercise.defaultWeightKg}
              defaultReps={exercise.defaultReps}
              onLogged={onLogged}
              onRemove={() => removeExerciseFromWorkout(active.id, id)}
            />
          );
        })}
      </div>

      <button
        onClick={() => setPickerOpen(true)}
        className="mt-3 w-full rounded-2xl border-[1.5px] border-dashed border-line-bright bg-transparent py-4 text-[15px] font-bold text-text-dim active:border-accent active:text-accent"
      >
        +&nbsp; ADD EXERCISE
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

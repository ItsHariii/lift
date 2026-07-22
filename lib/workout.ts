import { db, uid, type Workout } from "./db";

/** The current unfinished workout, or null when none (null = loaded-but-empty). */
export async function getActiveWorkout(): Promise<Workout | null> {
  const all = await db.workouts.toArray();
  return all.find((w) => !w.finishedAt) ?? null;
}

export async function startWorkout(opts?: {
  routineId?: string;
  routineName?: string;
  exerciseIds?: string[];
  startLat?: number;
  startLng?: number;
}): Promise<Workout> {
  const existing = await getActiveWorkout();
  if (existing) return existing;
  const w: Workout = {
    id: uid(),
    startedAt: new Date().toISOString(),
    routineId: opts?.routineId,
    routineName: opts?.routineName,
    exerciseIds: opts?.exerciseIds ?? [],
    startLat: opts?.startLat,
    startLng: opts?.startLng,
  };
  await db.workouts.add(w);
  return w;
}

export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
): Promise<void> {
  const w = await db.workouts.get(workoutId);
  if (!w) return;
  const ids = w.exerciseIds ?? [];
  if (!ids.includes(exerciseId)) {
    await db.workouts.update(workoutId, { exerciseIds: [...ids, exerciseId] });
  }
}

export async function removeExerciseFromWorkout(
  workoutId: string,
  exerciseId: string,
): Promise<void> {
  const w = await db.workouts.get(workoutId);
  if (!w) return;
  await db.transaction("rw", db.workouts, db.sets, async () => {
    await db.workouts.update(workoutId, {
      exerciseIds: (w.exerciseIds ?? []).filter((id) => id !== exerciseId),
    });
    const sets = await db.sets
      .where("workoutId")
      .equals(workoutId)
      .filter((s) => s.exerciseId === exerciseId)
      .toArray();
    await db.sets.bulkDelete(sets.map((s) => s.id));
  });
}

/** Finish (or discard if empty). Returns true if kept. */
export async function finishWorkout(workoutId: string): Promise<boolean> {
  const setCount = await db.sets
    .where("workoutId")
    .equals(workoutId)
    .count();
  if (setCount === 0) {
    await db.workouts.delete(workoutId);
    return false;
  }
  await db.workouts.update(workoutId, {
    finishedAt: new Date().toISOString(),
  });
  return true;
}

export async function discardWorkout(workoutId: string): Promise<void> {
  await db.transaction("rw", db.workouts, db.sets, async () => {
    const sets = await db.sets.where("workoutId").equals(workoutId).toArray();
    await db.sets.bulkDelete(sets.map((s) => s.id));
    await db.workouts.delete(workoutId);
  });
}

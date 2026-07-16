import { db, uid, type WorkoutSet, type RepMax } from "./db";
import type { Unit } from "./units";

export const rmKey = (exerciseId: string, reps: number) =>
  `${exerciseId}:${reps}`;

export interface LogResult {
  set: WorkoutSet;
  isPR: boolean;
  /** previous best weight (kg) at this rep count, if any */
  prevBestKg?: number;
}

/**
 * Log a set. A set is a PR when its weight beats the previous best weight
 * recorded at that exact rep count (rep-max model — no 1RM estimation).
 */
export async function logSet(input: {
  workoutId: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  unit: Unit;
}): Promise<LogResult> {
  const key = rmKey(input.exerciseId, input.reps);
  return db.transaction("rw", db.sets, db.repMaxes, async () => {
    const prev = await db.repMaxes.get(key);
    const isPR = !prev || input.weightKg > prev.bestWeightKg + 1e-6;

    const set: WorkoutSet = {
      id: uid(),
      workoutId: input.workoutId,
      exerciseId: input.exerciseId,
      weightKg: input.weightKg,
      reps: input.reps,
      unit: input.unit,
      isPR,
      createdAt: new Date().toISOString(),
    };
    await db.sets.add(set);

    if (isPR) {
      const rm: RepMax = {
        key,
        exerciseId: input.exerciseId,
        reps: input.reps,
        bestWeightKg: input.weightKg,
        setId: set.id,
        date: set.createdAt,
      };
      await db.repMaxes.put(rm);
    }

    return { set, isPR, prevBestKg: prev?.bestWeightKg };
  });
}

/** Delete a set and recompute the affected rep-max cache row. */
export async function deleteSet(setId: string): Promise<void> {
  await db.transaction("rw", db.sets, db.repMaxes, async () => {
    const set = await db.sets.get(setId);
    if (!set) return;
    await db.sets.delete(setId);
    await recomputeRepMax(set.exerciseId, set.reps);
  });
}

/** Rebuild the rep-max row for one (exercise, reps) from remaining sets. */
export async function recomputeRepMax(
  exerciseId: string,
  reps: number,
): Promise<void> {
  const key = rmKey(exerciseId, reps);
  const sets = await db.sets
    .where("exerciseId")
    .equals(exerciseId)
    .filter((s) => s.reps === reps)
    .toArray();

  if (sets.length === 0) {
    await db.repMaxes.delete(key);
    return;
  }
  const best = sets.reduce((a, b) => (b.weightKg > a.weightKg ? b : a));
  await db.repMaxes.put({
    key,
    exerciseId,
    reps,
    bestWeightKg: best.weightKg,
    setId: best.id,
    date: best.createdAt,
  });
}

/** Most recent set for an exercise (used to prefill inputs). */
export async function lastSetFor(
  exerciseId: string,
): Promise<WorkoutSet | undefined> {
  const sets = await db.sets
    .where("exerciseId")
    .equals(exerciseId)
    .reverse()
    .sortBy("createdAt");
  return sets[0];
}

/** Full rep-max table for an exercise, sorted by reps ascending. */
export async function repMaxTable(exerciseId: string): Promise<RepMax[]> {
  const rows = await db.repMaxes
    .where("exerciseId")
    .equals(exerciseId)
    .toArray();
  return rows.sort((a, b) => a.reps - b.reps);
}

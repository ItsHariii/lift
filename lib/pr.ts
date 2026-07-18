import { db, uid, type WorkoutSet, type RepMax } from "./db";
import type { Unit } from "./units";

export const rmKey = (exerciseId: string, reps: number) =>
  `${exerciseId}:${reps}`;

export interface LogResult {
  set: WorkoutSet;
  isPR: boolean;
  /** previous all-time best weight (kg) for this exercise, if any */
  prevBestKg?: number;
}

const EPS = 1e-6;

/**
 * Log a set. A set is a PR only when it beats the exercise's all-time best:
 * strictly heavier than any previous set, or the same top weight for more
 * reps than ever done at (or above) that weight. Dropping the weight to hit
 * a new rep count is NOT a PR. The very first set of an exercise sets the
 * baseline and counts as a PR.
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
    const rows = await db.repMaxes
      .where("exerciseId")
      .equals(input.exerciseId)
      .toArray();

    let isPR: boolean;
    let prevBestKg: number | undefined;
    if (rows.length === 0) {
      isPR = true;
    } else {
      const bestKg = Math.max(...rows.map((row) => row.bestWeightKg));
      prevBestKg = bestKg;
      if (input.weightKg > bestKg + EPS) {
        isPR = true;
      } else if (input.weightKg < bestKg - EPS) {
        isPR = false;
      } else {
        // Same top weight: PR only if more reps than ever done at ≥ this weight.
        const maxReps = Math.max(
          ...rows
            .filter((row) => row.bestWeightKg >= input.weightKg - EPS)
            .map((row) => row.reps),
        );
        isPR = input.reps > maxReps;
      }
    }

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

    // Keep the per-rep-count cache accurate regardless of PR celebration,
    // so the Stats rep-max table stays correct.
    const prevRow = rows.find((row) => row.key === key);
    if (!prevRow || input.weightKg > prevRow.bestWeightKg + EPS) {
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

    return { set, isPR, prevBestKg };
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

export interface LastSession {
  /** startedAt of the workout the sets came from (falls back to first set time) */
  date: string;
  sets: WorkoutSet[];
}

/**
 * Sets from the most recent *previous* workout containing this exercise
 * (excluding the given in-progress workout). Drives the "last session" ghost.
 */
export async function lastSessionFor(
  exerciseId: string,
  excludeWorkoutId: string,
): Promise<LastSession | undefined> {
  const sets = await db.sets
    .where("exerciseId")
    .equals(exerciseId)
    .toArray();
  const byWorkout = new Map<string, WorkoutSet[]>();
  for (const s of sets) {
    if (s.workoutId === excludeWorkoutId) continue;
    if (!byWorkout.has(s.workoutId)) byWorkout.set(s.workoutId, []);
    byWorkout.get(s.workoutId)!.push(s);
  }
  if (byWorkout.size === 0) return undefined;

  let best: WorkoutSet[] | undefined;
  for (const group of byWorkout.values()) {
    group.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (!best || group[0].createdAt > best[0].createdAt) best = group;
  }
  if (!best) return undefined;

  const workout = await db.workouts.get(best[0].workoutId);
  return { date: workout?.startedAt ?? best[0].createdAt, sets: best };
}

/** Full rep-max table for an exercise, sorted by reps ascending. */
export async function repMaxTable(exerciseId: string): Promise<RepMax[]> {
  const rows = await db.repMaxes
    .where("exerciseId")
    .equals(exerciseId)
    .toArray();
  return rows.sort((a, b) => a.reps - b.reps);
}

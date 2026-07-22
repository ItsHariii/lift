import { db, type Workout, type WorkoutSet } from "./db";

export const dayKey = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export interface WorkoutSummary {
  workout: Workout;
  sets: WorkoutSet[];
  totalSets: number;
  volumeKg: number;
  prCount: number;
  durationMin: number | null;
  byExercise: Map<string, WorkoutSet[]>;
}

export async function getFinishedSummaries(): Promise<WorkoutSummary[]> {
  const workouts = (await db.workouts.toArray())
    .filter((w) => w.finishedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const allSets = await db.sets.toArray();
  const byWorkout = new Map<string, WorkoutSet[]>();
  for (const s of allSets) {
    if (!byWorkout.has(s.workoutId)) byWorkout.set(s.workoutId, []);
    byWorkout.get(s.workoutId)!.push(s);
  }

  return workouts.map((w) => {
    const sets = (byWorkout.get(w.id) ?? []).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
    const byExercise = new Map<string, WorkoutSet[]>();
    for (const s of sets) {
      if (!byExercise.has(s.exerciseId)) byExercise.set(s.exerciseId, []);
      byExercise.get(s.exerciseId)!.push(s);
    }
    const volumeKg = sets.reduce((a, s) => a + s.weightKg * s.reps, 0);
    const durationMin =
      w.finishedAt != null
        ? Math.round(
            (new Date(w.finishedAt).getTime() -
              new Date(w.startedAt).getTime()) /
              60000,
          )
        : null;
    return {
      workout: w,
      sets,
      totalSets: sets.length,
      volumeKg,
      prCount: sets.filter((s) => s.isPR).length,
      durationMin,
      byExercise,
    };
  });
}

/**
 * Consecutive-day training streak. A single rest day is tolerated so it
 * survives normal off-days; two missed days in a row ends the streak.
 */
export function currentStreak(summaries: WorkoutSummary[]): number {
  const days = new Set(summaries.map((s) => dayKey(s.workout.startedAt)));
  if (days.size === 0) return 0;
  // sortable YYYY-MM-DD keys — floor stops the loop at the earliest logged day
  const earliest = [...days].sort()[0];
  let streak = 0;
  let misses = 0;
  const cursor = new Date();
  while (dayKey(cursor) >= earliest) {
    if (days.has(dayKey(cursor))) {
      streak++;
      misses = 0;
    } else {
      misses++;
      if (misses > 1) break; // two consecutive missed days ends the streak
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface HeatCell {
  key: string;
  date: Date;
  count: number;
}

/** Last `weeks` weeks of daily set counts, oldest→newest, week-aligned. */
export function buildHeatmap(
  summaries: WorkoutSummary[],
  weeks = 18,
): HeatCell[][] {
  const perDay = new Map<string, number>();
  for (const s of summaries) {
    const k = dayKey(s.workout.startedAt);
    perDay.set(k, (perDay.get(k) ?? 0) + s.totalSets);
  }
  const end = new Date();
  // move to end of current week (Saturday)
  end.setDate(end.getDate() + (6 - end.getDay()));
  const cols: HeatCell[][] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const col: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(end);
      date.setDate(end.getDate() - w * 7 - (6 - d));
      const key = dayKey(date);
      col.push({ key, date, count: perDay.get(key) ?? 0 });
    }
    cols.push(col);
  }
  return cols;
}

export interface WeekVolume {
  /** e.g. "Jul 13" — Sunday the week starts on */
  label: string;
  /** volume kg per muscle group */
  byGroup: Record<string, number>;
  totalKg: number;
}

/**
 * Weekly tonnage split by muscle group for the last `weeks` weeks
 * (oldest→newest, Sunday-aligned like the heatmap). `groups` is every
 * muscle group seen, ordered by total volume descending.
 */
export function weeklyMuscleVolume(
  summaries: WorkoutSummary[],
  groupOf: (exerciseId: string) => string,
  weeks = 8,
): { weeks: WeekVolume[]; groups: string[] } {
  const weekStart = (d: Date) => {
    const s = new Date(d);
    s.setHours(0, 0, 0, 0);
    s.setDate(s.getDate() - s.getDay());
    return s;
  };

  const start = weekStart(new Date());
  start.setDate(start.getDate() - (weeks - 1) * 7);

  const buckets: WeekVolume[] = [];
  for (let w = 0; w < weeks; w++) {
    const d = new Date(start);
    d.setDate(start.getDate() + w * 7);
    buckets.push({
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      byGroup: {},
      totalKg: 0,
    });
  }

  const groupTotals = new Map<string, number>();
  for (const summary of summaries) {
    const started = new Date(summary.workout.startedAt);
    const index = Math.floor(
      (weekStart(started).getTime() - start.getTime()) / (7 * 86400000),
    );
    if (index < 0 || index >= weeks) continue;
    for (const [exerciseId, sets] of summary.byExercise) {
      const group = groupOf(exerciseId);
      const volume = sets.reduce((a, s) => a + s.weightKg * s.reps, 0);
      const bucket = buckets[index];
      bucket.byGroup[group] = (bucket.byGroup[group] ?? 0) + volume;
      bucket.totalKg += volume;
      groupTotals.set(group, (groupTotals.get(group) ?? 0) + volume);
    }
  }

  const groups = [...groupTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);
  return { weeks: buckets, groups };
}

export interface ExercisePoint {
  date: string;
  label: string;
  bestWeightKg: number;
  volumeKg: number;
  setCount: number;
}

/** Per-session best-weight + volume series for one exercise (oldest→newest). */
export async function exerciseSeries(
  exerciseId: string,
): Promise<ExercisePoint[]> {
  const sets = await db.sets
    .where("exerciseId")
    .equals(exerciseId)
    .toArray();
  const byWorkout = new Map<string, WorkoutSet[]>();
  for (const s of sets) {
    if (!byWorkout.has(s.workoutId)) byWorkout.set(s.workoutId, []);
    byWorkout.get(s.workoutId)?.push(s);
  }
  const workouts = await db.workouts.bulkGet([...byWorkout.keys()]);
  const startedAtByWorkout = new Map(
    workouts.flatMap((workout) =>
      workout ? [[workout.id, workout.startedAt] as const] : [],
    ),
  );

  return [...byWorkout.entries()]
    .map(([workoutId, workoutSets]) => {
      const startedAt =
        startedAtByWorkout.get(workoutId) ?? workoutSets[0].createdAt;
      const date = dayKey(startedAt);
      return {
        date: startedAt,
        label: date.slice(5),
        bestWeightKg: Math.max(...workoutSets.map((set) => set.weightKg)),
        volumeKg: workoutSets.reduce(
          (total, set) => total + set.weightKg * set.reps,
          0,
        ),
        setCount: workoutSets.length,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function exerciseIdsWithData(): Promise<string[]> {
  const sets = await db.sets.toArray();
  return [...new Set(sets.map((s) => s.exerciseId))];
}

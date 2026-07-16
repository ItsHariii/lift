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

/** Consecutive-day training streak ending today or yesterday. */
export function currentStreak(summaries: WorkoutSummary[]): number {
  const days = new Set(summaries.map((s) => dayKey(s.workout.startedAt)));
  let streak = 0;
  const cursor = new Date();
  // allow streak to count if today not yet trained but yesterday was
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) {
    streak++;
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

export interface ExercisePoint {
  date: string;
  label: string;
  bestWeightKg: number;
  volumeKg: number;
}

/** Per-session best-weight + volume series for one exercise (oldest→newest). */
export async function exerciseSeries(
  exerciseId: string,
): Promise<ExercisePoint[]> {
  const sets = await db.sets
    .where("exerciseId")
    .equals(exerciseId)
    .toArray();
  const byDay = new Map<string, WorkoutSet[]>();
  for (const s of sets) {
    const k = dayKey(s.createdAt);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(s);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, ss]) => ({
      date: k,
      label: k.slice(5),
      bestWeightKg: Math.max(...ss.map((s) => s.weightKg)),
      volumeKg: ss.reduce((a, s) => a + s.weightKg * s.reps, 0),
    }));
}

export async function exerciseIdsWithData(): Promise<string[]> {
  const sets = await db.sets.toArray();
  return [...new Set(sets.map((s) => s.exerciseId))];
}

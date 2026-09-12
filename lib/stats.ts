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
  /** a PR landed on this day — painted gold rather than orange */
  pr: boolean;
  /** later than today: drawn as an empty slot, not a zero-volume day */
  future: boolean;
}

/** Last `weeks` weeks of daily set counts, oldest→newest, week-aligned. */
export function buildHeatmap(
  summaries: WorkoutSummary[],
  weeks = 18,
): HeatCell[][] {
  const perDay = new Map<string, number>();
  const prDays = new Set<string>();
  for (const s of summaries) {
    const k = dayKey(s.workout.startedAt);
    perDay.set(k, (perDay.get(k) ?? 0) + s.totalSets);
    if (s.prCount > 0) prDays.add(k);
  }
  const todayKey = dayKey(new Date());
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
      col.push({
        key,
        date,
        count: perDay.get(key) ?? 0,
        pr: prDays.has(key),
        future: key > todayKey,
      });
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

/** Month strips sitting above the heatmap, one per run of columns. */
export function heatMonthLabels(
  columns: HeatCell[][],
): { key: string; label: string; columns: number }[] {
  const strips: { key: string; label: string; columns: number }[] = [];
  for (const column of columns) {
    // the middle of the week decides the month, so a column straddling a
    // boundary lands under the month it mostly belongs to
    const label = (column[3] ?? column[0]).date.toLocaleDateString(undefined, {
      month: "short",
    });
    const last = strips[strips.length - 1];
    if (last && last.label === label) last.columns++;
    else strips.push({ key: column[0].key, label, columns: 1 });
  }
  // a one-column run has no room to print its name
  return strips.map((s) => (s.columns < 2 ? { ...s, label: "" } : s));
}

export interface WeekAggregate {
  /** Monday 00:00 the week starts on */
  start: Date;
  end: Date;
  list: WorkoutSummary[];
  sessions: number;
  sets: number;
  volumeKg: number;
  prs: number;
}

/** Monday-aligned week totals. `weeksAgo` 0 is the current week, 1 the last. */
export function weekAggregate(
  summaries: WorkoutSummary[],
  weeksAgo = 0,
): WeekAggregate {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - weeksAgo * 7);
  const end = new Date(start.getTime() + 7 * 86400000 - 1);

  const list = summaries.filter((summary) => {
    const started = new Date(summary.workout.startedAt);
    return started >= start && started <= end;
  });
  return {
    start,
    end,
    list,
    sessions: list.length,
    sets: list.reduce((total, s) => total + s.totalSets, 0),
    volumeKg: list.reduce((total, s) => total + s.volumeKg, 0),
    prs: list.reduce((total, s) => total + s.prCount, 0),
  };
}

/** Longest run of back-to-back training days ever logged. */
export function bestStreak(summaries: WorkoutSummary[]): number {
  const keys = [
    ...new Set(summaries.map((s) => dayKey(s.workout.startedAt))),
  ].sort();
  let best = 0;
  let run = 0;
  let previous: number | null = null;
  for (const key of keys) {
    const [y, m, d] = key.split("-").map(Number);
    const time = new Date(y, m - 1, d).getTime();
    run = previous != null && time - previous === 86400000 ? run + 1 : 1;
    previous = time;
    best = Math.max(best, run);
  }
  return best;
}

/** Epley estimate of a one-rep max. */
export function e1rm(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

export interface Mover {
  exerciseId: string;
  /** percent added since the first logged session */
  pct: number;
  firstKg: number;
  bestKg: number;
}

/**
 * Exercises ranked by percentage gained since their first session, so a 40kg
 * accessory competes with a 190kg deadlift on the same terms.
 */
export function biggestMovers(
  summaries: WorkoutSummary[],
  limit = 5,
): Mover[] {
  const oldestFirst = [...summaries].sort((a, b) =>
    a.workout.startedAt.localeCompare(b.workout.startedAt),
  );
  const firstBest = new Map<string, number>();
  const allBest = new Map<string, number>();
  const sessionCount = new Map<string, number>();

  for (const summary of oldestFirst) {
    for (const [exerciseId, sets] of summary.byExercise) {
      const best = Math.max(...sets.map((set) => set.weightKg));
      if (!firstBest.has(exerciseId)) firstBest.set(exerciseId, best);
      allBest.set(exerciseId, Math.max(allBest.get(exerciseId) ?? 0, best));
      sessionCount.set(exerciseId, (sessionCount.get(exerciseId) ?? 0) + 1);
    }
  }

  return [...firstBest.entries()]
    .filter(([id, first]) => first > 0 && (sessionCount.get(id) ?? 0) > 1)
    .map(([exerciseId, firstKg]) => {
      const bestKg = allBest.get(exerciseId) ?? firstKg;
      return {
        exerciseId,
        firstKg,
        bestKg,
        pct: Math.round((bestKg / firstKg - 1) * 100),
      };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, limit);
}

export interface PRRecord {
  exerciseId: string;
  /** ISO start of the session it was hit in */
  date: string;
  weightKg: number;
  reps: number;
  /** best weight for the exercise before this set; 0 when it was the first */
  prevKg: number;
}

/** Every PR ever logged, newest first. */
export function prRecords(summaries: WorkoutSummary[]): PRRecord[] {
  const oldestFirst = [...summaries].sort((a, b) =>
    a.workout.startedAt.localeCompare(b.workout.startedAt),
  );
  const running = new Map<string, number>();
  const records: PRRecord[] = [];

  for (const summary of oldestFirst) {
    for (const set of summary.sets) {
      if (!set.isPR) continue;
      records.push({
        exerciseId: set.exerciseId,
        date: summary.workout.startedAt,
        weightKg: set.weightKg,
        reps: set.reps,
        prevKg: running.get(set.exerciseId) ?? 0,
      });
      running.set(set.exerciseId, set.weightKg);
    }
  }
  return records.reverse();
}

export interface BalanceSlice {
  group: string;
  volumeKg: number;
  /** share of the window's total volume, rounded to whole percent */
  pct: number;
}

/** Volume split by muscle group over the last `days`, biggest share first. */
export function muscleBalance(
  summaries: WorkoutSummary[],
  groupOf: (exerciseId: string) => string,
  days = 30,
): BalanceSlice[] {
  const cutoff = Date.now() - days * 86400000;
  const byGroup = new Map<string, number>();
  let total = 0;

  for (const summary of summaries) {
    if (new Date(summary.workout.startedAt).getTime() < cutoff) continue;
    for (const [exerciseId, sets] of summary.byExercise) {
      const group = groupOf(exerciseId);
      const volume = sets.reduce((a, set) => a + set.weightKg * set.reps, 0);
      byGroup.set(group, (byGroup.get(group) ?? 0) + volume);
      total += volume;
    }
  }

  return [...byGroup.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([group, volumeKg]) => ({
      group,
      volumeKg,
      pct: total > 0 ? Math.round((volumeKg / total) * 100) : 0,
    }));
}

import {
  db,
  uid,
  DEFAULT_SETTINGS,
  type Exercise,
  type RepMax,
  type WorkoutSet,
} from "./db";
import { rmKey } from "./pr";
import { toKg } from "./units";

const STARTER: Omit<Exercise, "id">[] = [
  { name: "Back Squat", muscleGroup: "Legs", builtin: true },
  { name: "Front Squat", muscleGroup: "Legs", builtin: true },
  { name: "Leg Press", muscleGroup: "Legs", builtin: true },
  { name: "Romanian Deadlift", muscleGroup: "Legs", builtin: true },
  { name: "Leg Curl", muscleGroup: "Legs", builtin: true },
  { name: "Leg Extension", muscleGroup: "Legs", builtin: true },
  { name: "Walking Lunge", muscleGroup: "Legs", builtin: true },
  { name: "Calf Raise", muscleGroup: "Legs", builtin: true },
  { name: "Bench Press", muscleGroup: "Chest", builtin: true },
  { name: "Incline Bench Press", muscleGroup: "Chest", builtin: true },
  { name: "Dumbbell Press", muscleGroup: "Chest", builtin: true },
  { name: "Cable Fly", muscleGroup: "Chest", builtin: true },
  { name: "Dips", muscleGroup: "Chest", builtin: true },
  { name: "Deadlift", muscleGroup: "Back", builtin: true },
  { name: "Pull-Up", muscleGroup: "Back", builtin: true },
  { name: "Barbell Row", muscleGroup: "Back", builtin: true },
  { name: "Lat Pulldown", muscleGroup: "Back", builtin: true },
  { name: "Seated Cable Row", muscleGroup: "Back", builtin: true },
  { name: "Face Pull", muscleGroup: "Back", builtin: true },
  { name: "Overhead Press", muscleGroup: "Shoulders", builtin: true },
  { name: "Dumbbell Shoulder Press", muscleGroup: "Shoulders", builtin: true },
  { name: "Lateral Raise", muscleGroup: "Shoulders", builtin: true },
  { name: "Rear Delt Fly", muscleGroup: "Shoulders", builtin: true },
  { name: "Barbell Curl", muscleGroup: "Arms", builtin: true },
  { name: "Dumbbell Curl", muscleGroup: "Arms", builtin: true },
  { name: "Hammer Curl", muscleGroup: "Arms", builtin: true },
  { name: "Tricep Pushdown", muscleGroup: "Arms", builtin: true },
  { name: "Skull Crusher", muscleGroup: "Arms", builtin: true },
  { name: "Hanging Leg Raise", muscleGroup: "Core", builtin: true },
  { name: "Cable Crunch", muscleGroup: "Core", builtin: true },
  { name: "Plank", muscleGroup: "Core", builtin: true },
];

interface PersonalBaseline {
  name: string;
  muscleGroup: string;
  weightLb: number;
  reps?: number;
}

const PERSONAL_BASELINE: PersonalBaseline[] = [
  { name: "Incline DB Press", muscleGroup: "Chest", weightLb: 65, reps: 8 },
  { name: "Cable Fly", muscleGroup: "Chest", weightLb: 30, reps: 8 },
  { name: "Chest Press", muscleGroup: "Chest", weightLb: 80, reps: 6 },
  { name: "Pec Deck", muscleGroup: "Chest", weightLb: 212.5, reps: 6 },
  { name: "Incline Chest Press", muscleGroup: "Chest", weightLb: 95, reps: 6 },
  { name: "Dumbbell Shoulder Press", muscleGroup: "Shoulders", weightLb: 50, reps: 7 },
  { name: "Cable Lateral Raise", muscleGroup: "Shoulders", weightLb: 15 },
  { name: "Shoulder Press", muscleGroup: "Shoulders", weightLb: 115, reps: 8 },
  { name: "Dumbbell Lateral Raise", muscleGroup: "Shoulders", weightLb: 35 },
  { name: "V-Grip Pushdown", muscleGroup: "Triceps", weightLb: 70, reps: 9 },
  { name: "Single-Hand Cable Pushdown", muscleGroup: "Triceps", weightLb: 22.5, reps: 7.5 },
  { name: "Tricep Press", muscleGroup: "Triceps", weightLb: 190, reps: 6 },
  { name: "Tricep Overhead", muscleGroup: "Triceps", weightLb: 70, reps: 6 },
  { name: "Assisted Dips", muscleGroup: "Triceps", weightLb: 35, reps: 5 },
  { name: "High Row", muscleGroup: "Back", weightLb: 135, reps: 6 },
  { name: "Mid Row", muscleGroup: "Back", weightLb: 145, reps: 8 },
  { name: "MTS Row", muscleGroup: "Back", weightLb: 105, reps: 6 },
  { name: "Close-Grip Pulldown", muscleGroup: "Back", weightLb: 165, reps: 8 },
  { name: "Smith Shrugs", muscleGroup: "Back", weightLb: 55, reps: 11 },
  { name: "Assisted Pull-Ups", muscleGroup: "Back", weightLb: 50, reps: 6 },
  { name: "Back Extensions", muscleGroup: "Back", weightLb: 220 },
  { name: "Cable Pullovers", muscleGroup: "Back", weightLb: 65, reps: 6 },
  { name: "Seated Row", muscleGroup: "Back", weightLb: 240, reps: 5 },
  { name: "Lat Pulldown", muscleGroup: "Back", weightLb: 190, reps: 7 },
  { name: "Rear Delt Cable Fly", muscleGroup: "Rear Delts", weightLb: 10, reps: 8 },
  { name: "Archer Pulls", muscleGroup: "Rear Delts", weightLb: 45 },
  { name: "Pronated Cable Bar Curl", muscleGroup: "Biceps", weightLb: 50, reps: 8 },
  { name: "Incline DB Curl", muscleGroup: "Biceps", weightLb: 30, reps: 6 },
  { name: "Pronated DB Curl", muscleGroup: "Biceps", weightLb: 35, reps: 6 },
  { name: "Concentration DB Curl", muscleGroup: "Biceps", weightLb: 40 },
  { name: "Hammer Curl", muscleGroup: "Biceps", weightLb: 40, reps: 14 },
  { name: "Machine Hammer Curl", muscleGroup: "Biceps", weightLb: 145, reps: 6 },
  { name: "Leg Press", muscleGroup: "Legs", weightLb: 205, reps: 6 },
  { name: "Glute Leg Press", muscleGroup: "Legs", weightLb: 225, reps: 7 },
  { name: "Leg Curl", muscleGroup: "Legs", weightLb: 150, reps: 6 },
  { name: "Leg Extension", muscleGroup: "Legs", weightLb: 240, reps: 8 },
  { name: "Calf Raise", muscleGroup: "Legs", weightLb: 320 },
  { name: "Adductor Machine", muscleGroup: "Legs", weightLb: 180, reps: 7 },
  { name: "Abductor Machine", muscleGroup: "Legs", weightLb: 190, reps: 9 },
  { name: "Ab Crunch Machine", muscleGroup: "Abs", weightLb: 110, reps: 6 },
  { name: "Rotary Torso", muscleGroup: "Abs", weightLb: 170 },
  { name: "Leg Raises", muscleGroup: "Abs", weightLb: 0, reps: 15 },
  { name: "Forearm 1", muscleGroup: "Forearms", weightLb: 60, reps: 8 },
  { name: "Forearm 2", muscleGroup: "Forearms", weightLb: 40 },
];

const BASELINE_WORKOUT_ID = "personal-baseline-v1";
const BASELINE_STARTED_AT = "2026-07-15T12:00:00.000Z";

const normalizeName = (name: string) => name.trim().toLowerCase();
const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Seed the starter catalog and the owner's baseline without duplicating data. */
export async function ensureSeeded(): Promise<void> {
  await db.transaction(
    "rw",
    db.exercises,
    db.workouts,
    db.sets,
    db.repMaxes,
    db.settings,
    async () => {
      const settings = await db.settings.get("app");
      if (!settings) {
        if ((await db.exercises.count()) === 0) {
          await db.exercises.bulkAdd(
            STARTER.map((exercise) => ({ ...exercise, id: uid() })),
          );
        }
        await db.settings.put(DEFAULT_SETTINGS);
      }

      await seedPersonalBaseline();
    },
  );
}

async function seedPersonalBaseline() {
  const exercises = await db.exercises.toArray();
  const byName = new Map(
    exercises.map((exercise) => [normalizeName(exercise.name), exercise]),
  );
  const exerciseIdByName = new Map<string, string>();

  for (const baseline of PERSONAL_BASELINE) {
    const key = normalizeName(baseline.name);
    const existing = byName.get(key);
    const defaults = {
      muscleGroup: baseline.muscleGroup,
      defaultWeightKg: toKg(baseline.weightLb, "lb"),
      defaultReps: baseline.reps,
    };

    if (existing) {
      await db.exercises.update(existing.id, defaults);
      exerciseIdByName.set(key, existing.id);
      continue;
    }

    const exercise: Exercise = {
      id: `personal-${slug(baseline.name)}`,
      name: baseline.name,
      builtin: true,
      ...defaults,
    };
    await db.exercises.add(exercise);
    byName.set(key, exercise);
    exerciseIdByName.set(key, exercise.id);
  }

  // Workout ID is the migration marker: once seeded, user edits remain untouched.
  if (await db.workouts.get(BASELINE_WORKOUT_ID)) return;

  const sets: WorkoutSet[] = [];
  for (const [index, baseline] of PERSONAL_BASELINE.entries()) {
    if (baseline.reps == null) continue;
    const exerciseId = exerciseIdByName.get(normalizeName(baseline.name));
    if (!exerciseId) continue;

    const existingCount = await db.sets
      .where("exerciseId")
      .equals(exerciseId)
      .count();
    if (existingCount > 0) continue;

    const createdAt = new Date(
      new Date(BASELINE_STARTED_AT).getTime() + index * 60_000,
    ).toISOString();
    sets.push({
      id: `personal-baseline-set-${slug(baseline.name)}`,
      workoutId: BASELINE_WORKOUT_ID,
      exerciseId,
      weightKg: toKg(baseline.weightLb, "lb"),
      reps: baseline.reps,
      unit: "lb",
      isPR: true,
      createdAt,
    });
  }

  await db.workouts.add({
    id: BASELINE_WORKOUT_ID,
    routineName: "Personal Baseline",
    notes: "Imported personal starting weights",
    startedAt: BASELINE_STARTED_AT,
    finishedAt: new Date(
      new Date(BASELINE_STARTED_AT).getTime() + 60 * 60_000,
    ).toISOString(),
    exerciseIds: sets.map((set) => set.exerciseId),
  });

  for (const set of sets) {
    await db.sets.add(set);
    const key = rmKey(set.exerciseId, set.reps);
    const current = await db.repMaxes.get(key);
    if (!current || set.weightKg > current.bestWeightKg) {
      const repMax: RepMax = {
        key,
        exerciseId: set.exerciseId,
        reps: set.reps,
        bestWeightKg: set.weightKg,
        setId: set.id,
        date: set.createdAt,
      };
      await db.repMaxes.put(repMax);
    } else {
      await db.sets.update(set.id, { isPR: false });
    }
  }
}

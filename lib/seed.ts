import { db, uid, DEFAULT_SETTINGS, type Exercise } from "./db";

const STARTER: Omit<Exercise, "id">[] = [
  // Legs
  { name: "Back Squat", muscleGroup: "Legs", builtin: true },
  { name: "Front Squat", muscleGroup: "Legs", builtin: true },
  { name: "Leg Press", muscleGroup: "Legs", builtin: true },
  { name: "Romanian Deadlift", muscleGroup: "Legs", builtin: true },
  { name: "Leg Curl", muscleGroup: "Legs", builtin: true },
  { name: "Leg Extension", muscleGroup: "Legs", builtin: true },
  { name: "Walking Lunge", muscleGroup: "Legs", builtin: true },
  { name: "Calf Raise", muscleGroup: "Legs", builtin: true },
  // Chest
  { name: "Bench Press", muscleGroup: "Chest", builtin: true },
  { name: "Incline Bench Press", muscleGroup: "Chest", builtin: true },
  { name: "Dumbbell Press", muscleGroup: "Chest", builtin: true },
  { name: "Cable Fly", muscleGroup: "Chest", builtin: true },
  { name: "Dips", muscleGroup: "Chest", builtin: true },
  // Back
  { name: "Deadlift", muscleGroup: "Back", builtin: true },
  { name: "Pull-Up", muscleGroup: "Back", builtin: true },
  { name: "Barbell Row", muscleGroup: "Back", builtin: true },
  { name: "Lat Pulldown", muscleGroup: "Back", builtin: true },
  { name: "Seated Cable Row", muscleGroup: "Back", builtin: true },
  { name: "Face Pull", muscleGroup: "Back", builtin: true },
  // Shoulders
  { name: "Overhead Press", muscleGroup: "Shoulders", builtin: true },
  { name: "Dumbbell Shoulder Press", muscleGroup: "Shoulders", builtin: true },
  { name: "Lateral Raise", muscleGroup: "Shoulders", builtin: true },
  { name: "Rear Delt Fly", muscleGroup: "Shoulders", builtin: true },
  // Arms
  { name: "Barbell Curl", muscleGroup: "Arms", builtin: true },
  { name: "Dumbbell Curl", muscleGroup: "Arms", builtin: true },
  { name: "Hammer Curl", muscleGroup: "Arms", builtin: true },
  { name: "Tricep Pushdown", muscleGroup: "Arms", builtin: true },
  { name: "Skull Crusher", muscleGroup: "Arms", builtin: true },
  // Core
  { name: "Hanging Leg Raise", muscleGroup: "Core", builtin: true },
  { name: "Cable Crunch", muscleGroup: "Core", builtin: true },
  { name: "Plank", muscleGroup: "Core", builtin: true },
];

/** Seed the starter exercise library + default settings, once. */
export async function ensureSeeded(): Promise<void> {
  const existing = await db.settings.get("app");
  if (existing) return;
  await db.transaction("rw", db.exercises, db.settings, async () => {
    const count = await db.exercises.count();
    if (count === 0) {
      await db.exercises.bulkAdd(
        STARTER.map((e) => ({ ...e, id: uid() })),
      );
    }
    await db.settings.put(DEFAULT_SETTINGS);
  });
}

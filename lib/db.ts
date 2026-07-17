import Dexie, { type Table } from "dexie";
import type { Unit } from "./units";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  builtin?: boolean;
  /** Personal starting values used until the exercise has a logged set. */
  defaultWeightKg?: number;
  defaultReps?: number;
}

export interface Workout {
  id: string;
  /** ISO date-time the session started */
  startedAt: string;
  finishedAt?: string;
  routineId?: string;
  routineName?: string;
  notes?: string;
  /** ordered exercise membership (survives reload even before sets logged) */
  exerciseIds?: string[];
}

export interface WorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  /** canonical kilograms */
  weightKg: number;
  reps: number;
  /** unit it was entered in (for reference/redisplay) */
  unit: Unit;
  isPR: boolean;
  createdAt: string;
}

export interface Routine {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: string;
}

/** Denormalized best-weight-per-rep-count cache (drives PR detection). */
export interface RepMax {
  /** composite key `${exerciseId}:${reps}` */
  key: string;
  exerciseId: string;
  reps: number;
  bestWeightKg: number;
  setId: string;
  date: string;
}

export interface Settings {
  id: "app";
  unit: Unit;
  restSeconds: number;
  bodyweightKg?: number;
  autoRest: boolean;
}

export class LiftDB extends Dexie {
  exercises!: Table<Exercise, string>;
  workouts!: Table<Workout, string>;
  sets!: Table<WorkoutSet, string>;
  routines!: Table<Routine, string>;
  repMaxes!: Table<RepMax, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("lift");
    this.version(1).stores({
      exercises: "id, name, muscleGroup",
      workouts: "id, startedAt, finishedAt",
      sets: "id, workoutId, exerciseId, createdAt",
      routines: "id, name, createdAt",
      repMaxes: "key, exerciseId, reps",
      settings: "id",
    });
  }
}

export const db = new LiftDB();

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const DEFAULT_SETTINGS: Settings = {
  id: "app",
  unit: "kg",
  restSeconds: 120,
  autoRest: true,
};

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get("app");
  return s ?? DEFAULT_SETTINGS;
}

"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_SETTINGS, type Settings } from "./db";

/** Live settings (falls back to defaults before first write). */
export function useSettings(): Settings {
  return (
    useLiveQuery(() => db.settings.get("app"), [], DEFAULT_SETTINGS) ??
    DEFAULT_SETTINGS
  );
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const cur = (await db.settings.get("app")) ?? DEFAULT_SETTINGS;
  await db.settings.put({ ...cur, ...patch, id: "app" });
}

/** All exercises, sorted by group then name. */
export function useExercises() {
  return useLiveQuery(
    () =>
      db.exercises.toArray().then((xs) =>
        xs.sort(
          (a, b) =>
            a.muscleGroup.localeCompare(b.muscleGroup) ||
            a.name.localeCompare(b.name),
        ),
      ),
    [],
  );
}

/** Live map of exerciseId -> Exercise for quick lookups. */
export function useExerciseMap() {
  const xs = useExercises();
  if (!xs) return undefined;
  return new Map(xs.map((x) => [x.id, x]));
}

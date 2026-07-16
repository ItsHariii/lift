import { db, uid, type Routine } from "./db";

export async function createRoutine(
  name: string,
  exerciseIds: string[],
): Promise<string> {
  const id = uid();
  await db.routines.add({
    id,
    name: name.trim() || "Untitled",
    exerciseIds,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function updateRoutine(
  id: string,
  patch: Partial<Pick<Routine, "name" | "exerciseIds">>,
): Promise<void> {
  await db.routines.update(id, patch);
}

export async function deleteRoutine(id: string): Promise<void> {
  await db.routines.delete(id);
}

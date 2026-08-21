import { db, uid, type Routine } from "./db";

/** Manual order first, then newest-first for any row that predates sortOrder. */
function byListOrder(a: Routine, b: Routine): number {
  const delta = (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity);
  if (delta !== 0 && Number.isFinite(delta)) return delta;
  return b.createdAt.localeCompare(a.createdAt);
}

/**
 * Every plan in display order. Sorted in JS rather than via `orderBy` because
 * Dexie skips rows whose indexed key is undefined.
 */
export async function listRoutines(): Promise<Routine[]> {
  const routines = await db.routines.toArray();
  return routines.sort(byListOrder);
}

export async function createRoutine(
  name: string,
  exerciseIds: string[],
): Promise<string> {
  const id = uid();
  const existing = await db.routines.toArray();
  const lowest = existing.reduce(
    (min, routine) => Math.min(min, routine.sortOrder ?? 0),
    0,
  );
  await db.routines.add({
    id,
    name: name.trim() || "Untitled",
    exerciseIds,
    createdAt: new Date().toISOString(),
    // New plans land on top, matching the old newest-first behaviour.
    sortOrder: lowest - 1,
  });
  return id;
}

export async function updateRoutine(
  id: string,
  patch: Partial<Pick<Routine, "name" | "exerciseIds" | "sortOrder">>,
): Promise<void> {
  await db.routines.update(id, patch);
}

/** Persist a full top-to-bottom ordering of the plan list. */
export async function reorderRoutines(ids: string[]): Promise<void> {
  await db.transaction("rw", db.routines, async () => {
    await Promise.all(
      ids.map((id, index) => db.routines.update(id, { sortOrder: index })),
    );
  });
}

export async function deleteRoutine(id: string): Promise<void> {
  await db.routines.delete(id);
}

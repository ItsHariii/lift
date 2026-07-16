import { db } from "./db";

const TABLES = [
  "exercises",
  "workouts",
  "sets",
  "routines",
  "repMaxes",
  "settings",
] as const;

export interface Backup {
  app: "lift";
  version: 1;
  exportedAt: string;
  data: Record<string, unknown[]>;
}

export async function exportBackup(): Promise<Backup> {
  const data: Record<string, unknown[]> = {};
  for (const t of TABLES) {
    data[t] = await db.table(t).toArray();
  }
  return {
    app: "lift",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export async function downloadBackup(): Promise<void> {
  const backup = await exportBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lift-backup-${backup.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(json: string): Promise<void> {
  const parsed = JSON.parse(json) as Backup;
  if (parsed?.app !== "lift" || !parsed.data) {
    throw new Error("Not a valid LIFT backup file.");
  }
  await db.transaction("rw", db.tables, async () => {
    for (const t of TABLES) {
      const rows = parsed.data[t];
      if (!Array.isArray(rows)) continue;
      await db.table(t).clear();
      await db.table(t).bulkPut(rows);
    }
  });
}

export async function clearAll(): Promise<void> {
  await db.transaction("rw", db.tables, async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
    }
  });
}

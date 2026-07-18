import { db, uid, type BodyweightEntry } from "./db";
import { dayKey } from "./stats";

/** Log a weigh-in. Replaces any earlier entry from the same calendar day. */
export async function logBodyweight(weightKg: number): Promise<BodyweightEntry> {
  const now = new Date().toISOString();
  return db.transaction("rw", db.bodyweight, db.settings, async () => {
    const today = dayKey(now);
    const sameDay = (await db.bodyweight.toArray()).filter(
      (e) => dayKey(e.date) === today,
    );
    await db.bodyweight.bulkDelete(sameDay.map((e) => e.id));

    const entry: BodyweightEntry = { id: uid(), date: now, weightKg };
    await db.bodyweight.add(entry);

    const settings = await db.settings.get("app");
    if (settings) {
      await db.settings.put({ ...settings, bodyweightKg: weightKg });
    }
    return entry;
  });
}

export async function deleteBodyweight(id: string): Promise<void> {
  await db.transaction("rw", db.bodyweight, db.settings, async () => {
    await db.bodyweight.delete(id);
    const latest = await latestBodyweight();
    const settings = await db.settings.get("app");
    if (settings) {
      await db.settings.put({ ...settings, bodyweightKg: latest?.weightKg });
    }
  });
}

/** All weigh-ins, oldest→newest. */
export async function bodyweightSeries(): Promise<BodyweightEntry[]> {
  return db.bodyweight.orderBy("date").toArray();
}

export async function latestBodyweight(): Promise<BodyweightEntry | undefined> {
  return db.bodyweight.orderBy("date").last();
}

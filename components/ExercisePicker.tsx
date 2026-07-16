"use client";

import { useMemo, useState } from "react";
import Sheet from "./Sheet";
import { useExercises } from "@/lib/hooks";
import { db, uid, type Exercise } from "@/lib/db";
import { confirmBuzz } from "@/lib/haptics";

const GROUPS = ["Legs", "Chest", "Back", "Shoulders", "Arms", "Core"];

export async function createExercise(
  name: string,
  muscleGroup: string,
): Promise<string> {
  const id = uid();
  await db.exercises.add({ id, name: name.trim(), muscleGroup });
  return id;
}

export default function ExercisePicker({
  open,
  onClose,
  onPick,
  excludeIds = [],
}: {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
  excludeIds?: string[];
}) {
  const exercises = useExercises();
  const [q, setQ] = useState("");
  const [newGroup, setNewGroup] = useState("Legs");

  const filtered = useMemo(() => {
    const list = (exercises ?? []).filter((e) => !excludeIds.includes(e.id));
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter((e) => e.name.toLowerCase().includes(needle));
  }, [exercises, q, excludeIds]);

  const grouped = useMemo(() => {
    const m = new Map<string, Exercise[]>();
    for (const e of filtered) {
      if (!m.has(e.muscleGroup)) m.set(e.muscleGroup, []);
      m.get(e.muscleGroup)!.push(e);
    }
    return m;
  }, [filtered]);

  const exactExists = filtered.some(
    (e) => e.name.toLowerCase() === q.trim().toLowerCase(),
  );

  const pick = (id: string) => {
    confirmBuzz();
    onPick(id);
    setQ("");
    onClose();
  };

  const create = async () => {
    if (!q.trim()) return;
    const id = await createExercise(q, newGroup);
    pick(id);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add Exercise">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search or create…"
        className="mb-3 w-full rounded-xl border border-line bg-bg px-4 py-3 text-base outline-none focus:border-accent placeholder:text-text-faint"
      />

      {q.trim() && !exactExists && (
        <div className="mb-4">
          <button
            onClick={create}
            className="flex w-full items-center justify-between rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 active:scale-[0.99]"
          >
            <span className="font-semibold text-accent">
              Create “{q.trim()}”
            </span>
            <span className="label !text-accent-dim">new</span>
          </button>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setNewGroup(g)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  newGroup === g
                    ? "border-accent bg-accent text-black"
                    : "border-line text-text-dim"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 pb-2">
        {[...grouped.keys()].sort().map((group) => (
          <div key={group}>
            <div className="label mb-1.5">{group}</div>
            <div className="grid grid-cols-1 gap-1.5">
              {grouped.get(group)!.map((e) => (
                <button
                  key={e.id}
                  onClick={() => pick(e.id)}
                  className="flex items-center justify-between rounded-xl border border-line bg-bg px-4 py-3 text-left active:border-accent active:bg-surface-2"
                >
                  <span className="font-semibold">{e.name}</span>
                  <span className="text-text-faint text-lg">＋</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && !q.trim() && (
          <p className="py-8 text-center text-text-faint">No exercises.</p>
        )}
      </div>
    </Sheet>
  );
}

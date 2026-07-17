"use client";

import { useMemo, useState } from "react";
import Sheet from "./Sheet";
import { useExercises } from "@/lib/hooks";
import { db, uid, type Exercise } from "@/lib/db";
import { confirmBuzz } from "@/lib/haptics";

const PERSONAL_GROUPS = [
  "Chest",
  "Shoulders",
  "Triceps",
  "Back",
  "Rear Delts",
  "Biceps",
  "Legs",
  "Abs",
  "Forearms",
  "Arms",
  "Core",
];

async function createExercise(name: string, muscleGroup: string) {
  const id = uid();
  await db.exercises.add({
    id,
    name: name.trim(),
    muscleGroup,
  });
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
  const [query, setQuery] = useState("");
  const [newGroup, setNewGroup] = useState("Chest");
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const available = (exercises ?? []).filter(
      (exercise) => !excludeIds.includes(exercise.id),
    );
    if (!normalizedQuery) return available;
    return available.filter((exercise) =>
      exercise.name.toLowerCase().includes(normalizedQuery),
    );
  }, [exercises, excludeIds, normalizedQuery]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Exercise[]>();
    for (const exercise of filtered) {
      if (!groups.has(exercise.muscleGroup)) {
        groups.set(exercise.muscleGroup, []);
      }
      groups.get(exercise.muscleGroup)?.push(exercise);
    }
    return groups;
  }, [filtered]);

  const groupOptions = useMemo(
    () =>
      [...new Set([
        ...PERSONAL_GROUPS,
        ...(exercises ?? []).map((exercise) => exercise.muscleGroup),
      ])].sort(),
    [exercises],
  );
  const exactExists = (exercises ?? []).some(
    (exercise) => exercise.name.toLowerCase() === normalizedQuery,
  );

  const close = () => {
    setQuery("");
    onClose();
  };

  const pick = (id: string) => {
    confirmBuzz();
    onPick(id);
    close();
  };

  const create = async () => {
    if (!query.trim() || exactExists) return;
    pick(await createExercise(query, newGroup));
  };

  return (
    <Sheet open={open} onClose={close} title="Add Exercise">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search or create exercise"
        className="mb-3 w-full rounded-[14px] border border-line bg-bg-2 px-4 py-3.5 text-base text-text outline-none placeholder:text-text-faint focus:border-accent"
      />

      {normalizedQuery && !exactExists && (
        <section className="mb-5 rounded-[14px] border border-[rgba(255,91,31,.4)] bg-[rgba(255,91,31,.08)] p-3">
          <button
            onClick={create}
            className="flex w-full items-center justify-between border-0 bg-transparent text-left"
          >
            <span className="font-bold text-accent">
              Create &ldquo;{query.trim()}&rdquo;
            </span>
            <span className="label text-accent-dim">New</span>
          </button>
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {groupOptions.map((group) => (
              <button
                key={group}
                onClick={() => setNewGroup(group)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${
                  newGroup === group
                    ? "border-accent bg-accent text-[#1a1206]"
                    : "border-line text-text-dim"
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-4">
        {[...grouped.keys()].sort().map((group) => (
          <section key={group}>
            <div className="label mb-2 text-accent-dim">{group}</div>
            <div className="flex flex-col gap-2">
              {grouped.get(group)?.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => pick(exercise.id)}
                  className="flex items-center justify-between rounded-[14px] border border-line bg-bg-2 px-4 py-3.5 text-left active:border-accent active:bg-surface-2"
                >
                  <span className="text-[15px] font-bold">{exercise.name}</span>
                  <span className="text-xl text-text-faint">+</span>
                </button>
              ))}
            </div>
          </section>
        ))}
        {exercises !== undefined && filtered.length === 0 && exactExists && (
          <p className="py-8 text-center text-text-faint">
            Exercise already added.
          </p>
        )}
      </div>
    </Sheet>
  );
}

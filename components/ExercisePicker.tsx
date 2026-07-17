"use client";

import { useMemo } from "react";
import Sheet from "./Sheet";
import { useExercises } from "@/lib/hooks";
import type { Exercise } from "@/lib/db";
import { confirmBuzz } from "@/lib/haptics";

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
  const grouped = useMemo(() => {
    const groups = new Map<string, Exercise[]>();
    for (const exercise of exercises ?? []) {
      if (excludeIds.includes(exercise.id)) continue;
      if (!groups.has(exercise.muscleGroup)) {
        groups.set(exercise.muscleGroup, []);
      }
      groups.get(exercise.muscleGroup)?.push(exercise);
    }
    return groups;
  }, [exercises, excludeIds]);

  const pick = (id: string) => {
    confirmBuzz();
    onPick(id);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add Exercise">
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
        {exercises !== undefined && grouped.size === 0 && (
          <p className="py-8 text-center text-text-faint">
            No exercises available.
          </p>
        )}
      </div>
    </Sheet>
  );
}

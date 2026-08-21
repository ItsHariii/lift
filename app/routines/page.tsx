"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { type Routine } from "@/lib/db";
import { useExerciseMap } from "@/lib/hooks";
import {
  listRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  reorderRoutines,
} from "@/lib/routines";
import {
  startWorkout,
  getActiveWorkout,
  finishWorkout,
} from "@/lib/workout";
import { confirmBuzz } from "@/lib/haptics";
import PageHeader from "@/components/PageHeader";
import Sheet from "@/components/Sheet";
import ExercisePicker from "@/components/ExercisePicker";
import DragList, { GripIcon } from "@/components/DragList";

export default function RoutinesPage() {
  const router = useRouter();
  const routines = useLiveQuery(() => listRoutines(), [], undefined);
  const exMap = useExerciseMap();
  const [editing, setEditing] = useState<Routine | "new" | null>(null);
  // Holds the dropped order until the Dexie write lands, so the list never
  // snaps back to the old positions mid-write.
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);

  const byId = new Map((routines ?? []).map((routine) => [routine.id, routine]));
  const ordered =
    pendingOrder && pendingOrder.length === byId.size
      ? pendingOrder
          .map((id) => byId.get(id))
          .filter((routine): routine is Routine => routine != null)
      : (routines ?? []);

  const reorder = async (ids: string[]) => {
    setPendingOrder(ids);
    await reorderRoutines(ids);
    setPendingOrder(null);
  };

  const start = async (routine: Routine) => {
    const active = await getActiveWorkout();
    if (active) {
      if (!confirm("Finish current session and start this plan?")) return;
      await finishWorkout(active.id);
    }
    confirmBuzz();
    await startWorkout({
      routineId: routine.id,
      routineName: routine.name,
      exerciseIds: routine.exerciseIds,
    });
    router.push("/");
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Plans"
        right={
          <button
            onClick={() => setEditing("new")}
            className="display rounded-xl border-0 bg-accent px-4 py-[9px] text-base tracking-[0.04em] text-[#1a1206] active:scale-95"
          >
            + NEW
          </button>
        }
      />

      {!routines ? (
        <div className="pt-16 text-center text-text-faint">Loading...</div>
      ) : routines.length === 0 ? (
        <div className="rounded-[20px] border border-line bg-surface p-8 text-center text-text-faint">
          No plans yet. Build a routine once, launch it in one tap.
        </div>
      ) : (
        <DragList
          items={ordered.map((routine) => routine.id)}
          onReorder={reorder}
          className="flex flex-col gap-3"
        >
          {(id, handleProps, dragging) => {
            const routine = byId.get(id);
            if (!routine) return null;
            return (
            <section
              className={`relative overflow-hidden rounded-[20px] border bg-surface p-[18px] ${
                dragging
                  ? "border-accent shadow-[0_18px_40px_-16px_rgba(0,0,0,.9)]"
                  : "border-line"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h2 className="text-[21px] font-extrabold tracking-[-0.01em]">
                    {routine.name}
                  </h2>
                  <div className="label mt-[3px] tracking-[0.16em]">
                    {routine.exerciseIds.length} exercises
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => setEditing(routine)}
                    className="label rounded-[11px] border border-line bg-transparent px-[11px] py-2 font-semibold tracking-[0.12em] text-text-dim active:border-accent active:text-accent"
                  >
                    Edit
                  </button>
                  <button
                    {...handleProps}
                    className={`rounded-[11px] border border-line bg-transparent p-2 ${
                      dragging ? "text-accent" : "text-text-faint"
                    }`}
                  >
                    <GripIcon className="h-[18px] w-[18px]" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {routine.exerciseIds.slice(0, 6).map((id) => (
                  <span
                    key={id}
                    className="rounded-lg border border-line px-2.5 py-[5px] text-xs font-semibold text-text-dim"
                  >
                    {exMap?.get(id)?.name ?? "Exercise"}
                  </span>
                ))}
                {routine.exerciseIds.length > 6 && (
                  <span className="num self-center text-xs text-text-faint">
                    +{routine.exerciseIds.length - 6}
                  </span>
                )}
              </div>
              <button
                onClick={() => start(routine)}
                className="accent-button display mt-3.5 w-full rounded-[13px] border-0 py-[13px] text-[19px] tracking-[0.06em] active:scale-[0.99]"
              >
                START
              </button>
            </section>
            );
          }}
        </DragList>
      )}

      {editing && (
        <RoutineEditor
          routine={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function RoutineEditor({
  routine,
  onClose,
}: {
  routine: Routine | null;
  onClose: () => void;
}) {
  const exMap = useExerciseMap();
  const [name, setName] = useState(routine?.name ?? "");
  const [ids, setIds] = useState<string[]>(routine?.exerciseIds ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);

  const save = async () => {
    if (ids.length === 0) return;
    if (routine) {
      await updateRoutine(routine.id, {
        name: name.trim() || "Untitled",
        exerciseIds: ids,
      });
    } else {
      await createRoutine(name, ids);
    }
    confirmBuzz();
    onClose();
  };

  const remove = async () => {
    if (!routine || !confirm("Delete this plan?")) return;
    await deleteRoutine(routine.id);
    onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={routine ? "Edit Plan" : "New Plan"}
      footer={
        <div className="flex gap-2">
          {routine && (
            <button
              onClick={remove}
              className="rounded-[14px] border border-[rgba(255,87,71,.4)] bg-transparent px-[18px] py-3.5 font-bold text-danger active:bg-[rgba(255,87,71,.1)]"
            >
              Delete
            </button>
          )}
          <button
            onClick={save}
            disabled={ids.length === 0}
            className="display flex-1 rounded-[14px] border-0 bg-accent py-3.5 text-lg tracking-[0.05em] text-[#1a1206] disabled:opacity-40 active:scale-[0.99]"
          >
            SAVE PLAN
          </button>
        </div>
      }
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Plan name (e.g. Push Day)"
        className="mb-3 w-full rounded-[14px] border border-line bg-bg-2 px-4 py-3.5 text-base text-text outline-none placeholder:text-text-faint focus:border-accent"
      />

      <DragList items={ids} onReorder={setIds} className="flex flex-col gap-2">
        {(id, handleProps, dragging) => (
          <div
            className={`flex items-center gap-3 rounded-[14px] border bg-bg-2 px-3.5 py-[13px] ${
              dragging ? "border-accent" : "border-line"
            }`}
          >
            <button
              {...handleProps}
              className={`-my-1 border-0 bg-transparent p-1 ${
                dragging ? "text-accent" : "text-text-faint"
              }`}
            >
              <GripIcon />
            </button>
            <span className="flex-1 text-[15px] font-bold">
              {exMap?.get(id)?.name ?? "Exercise"}
            </span>
            <button
              onClick={() => setIds((values) => values.filter((value) => value !== id))}
              aria-label="remove"
              className="border-0 bg-transparent p-0.5 text-text-faint active:text-danger"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </DragList>

      <button
        onClick={() => setPickerOpen(true)}
        className="mt-2.5 w-full rounded-[14px] border-[1.5px] border-dashed border-line-bright bg-transparent py-[13px] text-sm font-bold text-text-dim active:border-accent active:text-accent"
      >
        + ADD EXERCISE
      </button>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(id) => setIds((values) => (values.includes(id) ? values : [...values, id]))}
        excludeIds={ids}
      />
    </Sheet>
  );
}

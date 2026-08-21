"use client";

import { useState } from "react";
import { tick, confirmBuzz } from "@/lib/haptics";

export type DragHandleProps = {
  onPointerDown: (event: React.PointerEvent) => void;
  style: React.CSSProperties;
  "aria-label": string;
};

type DragState = {
  from: number;
  to: number;
  dy: number;
  /** Pixel slide for every row, resolved when the target index changes. */
  offsets: number[];
};

/** How far each row slides to open a gap for the dragged row. */
function slideOffsets(rects: DOMRect[], from: number, to: number): number[] {
  return rects.map((_, index) => {
    if (to < from && index >= to && index < from) {
      return rects[index + 1].top - rects[index].top;
    }
    if (to > from && index > from && index <= to) {
      return -(rects[index].top - rects[index - 1].top);
    }
    return 0;
  });
}

/** Index of the row the dragged row should land on, given how far it moved. */
function targetIndex(rects: DOMRect[], from: number, dy: number): number {
  const center = rects[from].top + rects[from].height / 2 + dy;
  if (dy < 0) {
    for (let i = 0; i < from; i += 1) {
      if (center < rects[i].top + rects[i].height / 2) return i;
    }
  } else {
    for (let i = rects.length - 1; i > from; i -= 1) {
      if (center > rects[i].top + rects[i].height / 2) return i;
    }
  }
  return from;
}

/**
 * Vertical drag-to-reorder for a short list. Drags start from the handle only,
 * so buttons inside a row keep working. Row geometry is measured on pointerdown
 * rather than assumed uniform, because rows here vary in height.
 */
export default function DragList<T extends string>({
  items,
  onReorder,
  className,
  children,
}: {
  items: T[];
  onReorder: (next: T[]) => void;
  className?: string;
  children: (
    id: T,
    handleProps: DragHandleProps,
    dragging: boolean,
  ) => React.ReactNode;
}) {
  const [state, setState] = useState<DragState | null>(null);

  const begin = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const handle = event.currentTarget as HTMLElement;
    const row = handle.closest("[data-drag-row]");
    const rows = row?.parentElement?.children;
    if (!row || !rows || rows.length !== items.length) return;
    const from = Array.prototype.indexOf.call(rows, row);
    if (from < 0) return;

    // The whole drag session lives in this closure: nothing about it is needed
    // for rendering except the DragState mirrored into component state.
    const rects = Array.from(rows, (child) => child.getBoundingClientRect());
    const startY = event.clientY;
    let current: DragState = {
      from,
      to: from,
      dy: 0,
      offsets: rects.map(() => 0),
    };
    handle.setPointerCapture?.(event.pointerId);
    setState(current);

    const move = (moveEvent: PointerEvent) => {
      const dy = moveEvent.clientY - startY;
      const to = targetIndex(rects, from, dy);
      if (to !== current.to) tick();
      current = {
        from,
        to,
        dy,
        offsets:
          to === current.to ? current.offsets : slideOffsets(rects, from, to),
      };
      setState(current);
    };

    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      setState(null);
      if (current.to === current.from) return;
      const next = [...items];
      const [moved] = next.splice(current.from, 1);
      next.splice(current.to, 0, moved);
      confirmBuzz();
      onReorder(next);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  const handleProps: DragHandleProps = {
    onPointerDown: begin,
    style: { touchAction: "none" },
    "aria-label": "reorder",
  };

  return (
    <div className={className} style={state ? { userSelect: "none" } : undefined}>
      {items.map((id, index) => {
        const dragging = state?.from === index;
        const shift = dragging ? state.dy : (state?.offsets[index] ?? 0);
        return (
          <div
            key={id}
            data-drag-row=""
            style={{
              transform: shift ? `translateY(${shift}px)` : undefined,
              transition: dragging ? "none" : "transform .16s ease",
              position: dragging ? "relative" : undefined,
              zIndex: dragging ? 3 : undefined,
              willChange: state ? "transform" : undefined,
            }}
          >
            {children(id, handleProps, !!dragging)}
          </div>
        );
      })}
    </div>
  );
}

/** Shared grip glyph for drag handles. */
export function GripIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  );
}

"use client";

import { useEffect, useState } from "react";
import { computePlates, defaultBar } from "@/lib/plates";
import { clean, step as unitStep, type Unit } from "@/lib/units";
import Sheet from "./Sheet";
import Stepper from "./Stepper";

export default function PlateCalculator({
  open,
  onClose,
  weight,
  unit,
}: {
  open: boolean;
  onClose: () => void;
  /** target total weight in the display unit */
  weight: number;
  unit: Unit;
}) {
  const [bar, setBar] = useState(() => defaultBar(unit));

  // reset the bar to the unit default whenever the unit changes
  useEffect(() => setBar(defaultBar(unit)), [unit]);

  const { plates, leftover } = computePlates(weight, bar, unit);
  const perSide = clean(Math.max(0, (weight - bar) / 2));

  return (
    <Sheet open={open} onClose={onClose} title="Plates">
      <div className="pb-4">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="label tracking-[0.16em]">Target</span>
          <span className="num text-3xl font-extrabold tabular-nums">
            {clean(weight)}
            <span className="ml-1 text-base text-text-faint">{unit}</span>
          </span>
        </div>

        <div className="mb-5 flex gap-2.5">
          <Stepper
            label={`Bar · ${unit}`}
            value={bar}
            onChange={setBar}
            step={unitStep(unit)}
            min={0}
            decimals={1}
          />
        </div>

        <div className="label mb-2.5 tracking-[0.16em]">
          Per side · {perSide} {unit}
        </div>

        {plates.length === 0 ? (
          <p className="rounded-[14px] border border-line bg-bg-2 px-4 py-3.5 text-sm text-text-dim">
            Just the bar — no plates needed.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {plates.map(({ plate, count }) => (
              <div
                key={plate}
                className="flex items-center justify-between rounded-[12px] border border-line bg-bg-2 px-4 py-3"
              >
                <span className="num text-lg font-semibold tabular-nums">
                  {plate}
                  <span className="ml-1 text-xs text-text-faint">{unit}</span>
                </span>
                <span className="num text-lg font-extrabold tabular-nums text-accent">
                  ×&nbsp;{count}
                </span>
              </div>
            ))}
          </div>
        )}

        {leftover > 0 && (
          <p className="mt-3 rounded-[12px] border border-[rgba(255,87,71,.4)] bg-[rgba(255,87,71,.08)] px-4 py-2.5 text-xs text-danger">
            {leftover} {unit} per side can’t be made with standard plates.
          </p>
        )}
      </div>
    </Sheet>
  );
}

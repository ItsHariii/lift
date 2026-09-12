"use client";

import { useState, type CSSProperties } from "react";
import { useSettings, saveSettings } from "@/lib/hooks";
import {
  barForUnit,
  barOptions,
  countsOf,
  describeLoad,
  loadFromWeight,
  removeOne,
  sortLoad,
  specOf,
  specsFor,
  stackTotal,
  type PlateSpec,
} from "@/lib/plates";
import { clean, toKg, type Unit } from "@/lib/units";
import { DEFAULT_BAR_KG } from "@/lib/db";
import { tick, confirmBuzz } from "@/lib/haptics";
import Sheet from "./Sheet";

/** Total that counts as a heavy bar, for how far the sleeves sag. */
const HEAVY = { kg: 180, lb: 400 } as const;
const MAX_SAG = 7;

interface LoaderProps {
  open: boolean;
  onClose: () => void;
  /** current weight in the display unit, used to seed the bar */
  weight: number;
  unit: Unit;
  /** commit the loaded total back to the weight field */
  onApply: (total: number) => void;
}

/**
 * Remounted on every open (see PlateLoader below) so the bar always seeds from
 * whatever the weight field says right now.
 */
function Loader({ onClose, weight, unit, onApply }: Omit<LoaderProps, "open">) {
  const settings = useSettings();
  const bar = barForUnit(settings.barKg ?? DEFAULT_BAR_KG, unit);
  const specs = specsFor(unit);

  const [perSide, setPerSide] = useState(() =>
    loadFromWeight(weight, bar, unit),
  );
  // Frozen at mount: the seed is what the weight field asked for, and the
  // mismatch note below compares against it.
  const [seedBar] = useState(bar);
  const [seedTotal] = useState(() =>
    stackTotal(loadFromWeight(weight, bar, unit), bar),
  );

  const total = stackTotal(perSide, bar);
  const counts = countsOf(perSide);
  const loaded = sortLoad(perSide);
  const sag = Math.min(MAX_SAG, (total / HEAVY[unit]) * MAX_SAG);

  const add = (plate: number) => {
    setPerSide((current) => [...current, plate]);
    tick();
  };

  const drop = (plate: number) => {
    setPerSide((current) => removeOne(current, plate));
    tick();
  };

  const apply = () => {
    onApply(total);
    confirmBuzz();
    onClose();
  };

  const pickBar = (next: number) => {
    saveSettings({ barKg: toKg(next, unit) });
    tick();
  };

  const unreachable =
    seedBar === bar && total === seedTotal && clean(weight) !== seedTotal;

  return (
    <Sheet
      open
      onClose={onClose}
      title="Load the bar"
      footer={
        <div className="flex items-stretch gap-2.5">
          <button
            onClick={() => {
              setPerSide([]);
              tick();
            }}
            disabled={perSide.length === 0}
            className="label rounded-[14px] border border-line px-4 tracking-[0.16em] disabled:opacity-35 active:border-line-bright active:text-text-dim"
          >
            Strip
          </button>
          <button
            onClick={apply}
            className="accent-button display flex-1 rounded-[14px] border-0 py-3.5 text-xl tracking-[0.06em] active:scale-[0.99]"
          >
            USE {total} {unit.toUpperCase()}
          </button>
        </div>
      }
    >
      <div className="pb-1">
        <div className="flex items-end justify-between">
          <div>
            <div className="label tracking-[0.16em]">Total</div>
            <div
              key={total}
              className="display animate-pop mt-0.5 leading-[0.86] text-[clamp(48px,14vw,64px)] tracking-[0.01em] text-accent"
            >
              {total}
              <span className="ml-1.5 text-base text-text-faint">{unit}</span>
            </div>
          </div>
          <div className="num mb-1.5 max-w-[52%] text-right text-[11px] leading-[1.45] text-text-dim">
            {bar > 0 ? `${bar} bar` : "no bar"}
            {perSide.length > 0 && (
              <>
                <span className="text-text-faint"> + </span>
                {describeLoad(perSide)}
                <span className="text-text-faint"> / side</span>
              </>
            )}
          </div>
        </div>

        {unreachable && (
          <p className="num mt-1.5 text-[11px] text-text-faint">
            {clean(weight)} isn’t loadable — nearest is {seedTotal}.
          </p>
        )}

        <div className="-mx-5 mt-4 overflow-x-auto px-5 no-scrollbar">
          <div
            className="bar-rail"
            style={
              {
                "--disc": "clamp(92px,25vw,124px)",
                "--flex": sag,
              } as CSSProperties
            }
          >
            <div className="bar-shaft" />
            <div className="bar-side flex-row-reverse">
              <div className="bar-collar" />
              {loaded.map((plate, index) => (
                <Plate
                  key={`l-${plate}-${index}`}
                  spec={specOf(plate, unit)!}
                  direction={-1}
                  onClick={() => drop(plate)}
                  mirrored
                />
              ))}
            </div>
            <div className="bar-knurl" />
            <div className="bar-side">
              <div className="bar-collar" />
              {loaded.map((plate, index) => (
                <Plate
                  key={`r-${plate}-${index}`}
                  spec={specOf(plate, unit)!}
                  direction={1}
                  onClick={() => drop(plate)}
                  label={`remove one ${plate} ${unit} plate`}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="label mt-1 text-center tracking-[0.16em]">
          {perSide.length === 0
            ? bar > 0
              ? "Bare bar — tap a plate below"
              : "Nothing loaded"
            : "Tap a plate to strip it"}
        </p>

        <div className="label mb-2 mt-5 tracking-[0.16em]">Plates · per side</div>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
          {specs.map((spec) => {
            const count = counts.get(spec.weight) ?? 0;
            return (
              <div key={spec.weight} className="w-[54px] shrink-0">
                <button
                  onClick={() => add(spec.weight)}
                  aria-label={`add one ${spec.weight} ${unit} plate per side`}
                  className={`flex h-[76px] w-full flex-col items-center justify-end gap-1.5 rounded-t-[13px] border border-b-0 px-1 pb-1.5 pt-2 ${
                    count > 0
                      ? "border-line-bright bg-surface-2"
                      : "border-line bg-bg-2"
                  } active:border-accent`}
                >
                  <span
                    className="rounded-[2px]"
                    style={{
                      width: 16,
                      height: 12 + spec.ratio * 34,
                      background: `linear-gradient(102deg, rgba(255,255,255,.3), rgba(0,0,0,.4) 66%), ${spec.color}`,
                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,.5)",
                    }}
                  />
                  <span className="num text-[11px] font-semibold leading-none">
                    {spec.weight}
                  </span>
                </button>
                <button
                  onClick={() => drop(spec.weight)}
                  disabled={count === 0}
                  aria-label={`remove one ${spec.weight} ${unit} plate per side`}
                  className={`num flex h-[34px] w-full items-center justify-center gap-1 rounded-b-[13px] border text-[11px] font-semibold ${
                    count > 0
                      ? "border-line-bright bg-surface-2 text-accent active:bg-surface"
                      : "border-line bg-bg-2 text-text-faint opacity-45"
                  }`}
                >
                  <span className="text-[15px] leading-none">−</span>
                  <span>{count > 0 ? `×${count}` : "—"}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="label mb-2 mt-5 tracking-[0.16em]">Bar</div>
        <div className="flex gap-2 pb-2">
          {barOptions(unit).map((option) => (
            <button
              key={option}
              onClick={() => pickBar(option)}
              className={`num flex-1 rounded-xl border py-2.5 text-sm font-semibold ${
                bar === option
                  ? "border-accent bg-accent text-[#1a1206]"
                  : "border-line bg-transparent text-text-dim"
              }`}
            >
              {option === 0 ? "none" : option}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function Plate({
  spec,
  direction,
  onClick,
  label,
  mirrored = false,
}: {
  spec: PlateSpec;
  /** which way the plate slides in from, 1 = right sleeve */
  direction: 1 | -1;
  onClick: () => void;
  label?: string;
  /** the mirrored side is decorative — one set of controls per plate */
  mirrored?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-hidden={mirrored || undefined}
      tabIndex={mirrored ? -1 : undefined}
      className="plate-face plate-hit animate-plate-on flex items-center justify-center active:brightness-125"
      style={
        {
          "--plate": spec.color,
          "--ratio": spec.ratio,
          "--thick": spec.thickness,
          "--dir": direction,
          color: spec.ink,
        } as CSSProperties
      }
    >
      <span
        className="num plate-num font-bold opacity-85"
        style={{ fontSize: spec.thickness >= 15 ? 8 : 7 }}
      >
        {spec.weight}
      </span>
    </button>
  );
}

export default function PlateLoader({ open, ...rest }: LoaderProps) {
  if (!open) return null;
  return <Loader {...rest} />;
}

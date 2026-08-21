export type Unit = "kg" | "lb";

const KG_PER_LB = 0.45359237;

/** Convert a value entered in `unit` to canonical kilograms (stored). */
export function toKg(value: number, unit: Unit): number {
  return unit === "kg" ? value : value * KG_PER_LB;
}

/** Convert canonical kilograms to the display `unit`. */
export function fromKg(kg: number, unit: Unit): number {
  return unit === "kg" ? kg : kg / KG_PER_LB;
}

/**
 * Smallest sensible plate increment for the given unit at the given load.
 * Light lb loads move in 2.5 so small dumbbell/machine jumps are reachable;
 * kg is a flat 2.5 everywhere.
 */
export function step(unit: Unit, value?: number): number {
  if (unit === "kg") return 2.5;
  return value != null && value < 50 ? 2.5 : 5;
}

/** Trim floating noise, keep at most 1 decimal. */
export function clean(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Format a canonical kg weight for display in `unit` (no unit suffix). */
export function fmtWeight(kg: number, unit: Unit): string {
  const v = clean(fromKg(kg, unit));
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

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

/** Smallest sensible plate increment in the given unit. */
export function step(unit: Unit): number {
  return unit === "kg" ? 2.5 : 5;
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

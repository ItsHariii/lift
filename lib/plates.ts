import { clean, toKg, type Unit } from "./units";

/**
 * One plate denomination as it is rendered. `ratio` is the disc diameter
 * relative to a 450mm competition bumper, so a 1.25 reads as a washer next to
 * a 25 instead of a slightly shorter rectangle. Colours follow IWF discs in kg
 * and the common US bumper palette in lb.
 */
export interface PlateSpec {
  /** denomination in its own unit */
  weight: number;
  /** disc face */
  color: string;
  /** numeral printed on the face */
  ink: string;
  /** diameter relative to a 450mm bumper, 0..1 */
  ratio: number;
  /** rendered width in px */
  thickness: number;
}

const DARK = "#1a1206";
const LIGHT = "#f6efe0";

export const PLATE_SPECS_KG: PlateSpec[] = [
  { weight: 25, color: "#d42b2b", ink: LIGHT, ratio: 1, thickness: 24 },
  { weight: 20, color: "#2f6fd0", ink: LIGHT, ratio: 1, thickness: 22 },
  { weight: 15, color: "#e8b62c", ink: DARK, ratio: 0.89, thickness: 20 },
  { weight: 10, color: "#2f9e5c", ink: LIGHT, ratio: 0.72, thickness: 18 },
  { weight: 5, color: "#e5ded0", ink: DARK, ratio: 0.51, thickness: 15 },
  { weight: 2.5, color: "#b4322f", ink: LIGHT, ratio: 0.42, thickness: 12 },
  { weight: 1.25, color: "#a9a292", ink: DARK, ratio: 0.36, thickness: 10 },
];

export const PLATE_SPECS_LB: PlateSpec[] = [
  { weight: 45, color: "#2f6fd0", ink: LIGHT, ratio: 1, thickness: 24 },
  { weight: 35, color: "#e8b62c", ink: DARK, ratio: 0.89, thickness: 21 },
  { weight: 25, color: "#2f9e5c", ink: LIGHT, ratio: 0.72, thickness: 18 },
  { weight: 10, color: "#e5ded0", ink: DARK, ratio: 0.51, thickness: 15 },
  { weight: 5, color: "#b4322f", ink: LIGHT, ratio: 0.42, thickness: 12 },
  { weight: 2.5, color: "#a9a292", ink: DARK, ratio: 0.36, thickness: 10 },
];

/** Plate specs for the display unit, heaviest first. */
export function specsFor(unit: Unit): PlateSpec[] {
  return unit === "kg" ? PLATE_SPECS_KG : PLATE_SPECS_LB;
}

export function specOf(plate: number, unit: Unit): PlateSpec | undefined {
  return specsFor(unit).find((s) => s.weight === plate);
}

/** Standard plate denominations available per unit (heaviest first). */
const PLATES_KG = PLATE_SPECS_KG.map((s) => s.weight);
const PLATES_LB = PLATE_SPECS_LB.map((s) => s.weight);

/** Bar weights offered in the picker, in the display unit. 0 means no bar. */
export const BAR_OPTIONS_KG = [20, 15, 10, 0];
export const BAR_OPTIONS_LB = [45, 35, 25, 0];

export function barOptions(unit: Unit): number[] {
  return unit === "kg" ? BAR_OPTIONS_KG : BAR_OPTIONS_LB;
}

/**
 * The bar option in `unit` that best matches a stored canonical weight. Lets a
 * 20kg bar read as "45" in pounds instead of "44.1" without storing two values.
 */
export function barForUnit(barKg: number, unit: Unit): number {
  let best = barOptions(unit)[0];
  let bestDiff = Infinity;
  for (const option of barOptions(unit)) {
    const diff = Math.abs(toKg(option, unit) - barKg);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = option;
    }
  }
  return best;
}

export interface PlateStack {
  /** plate weight → how many go on ONE side of the bar */
  plates: { plate: number; count: number }[];
  /** per-side weight that couldn't be matched with standard plates */
  leftover: number;
}

/** Default barbell weight in the display unit. */
export function defaultBar(unit: Unit): number {
  return unit === "kg" ? 20 : 45;
}

/**
 * Greedily break the per-side load into plates. Works in the display unit
 * because plate denominations are unit-specific.
 */
export function computePlates(
  totalDisplay: number,
  barDisplay: number,
  unit: Unit,
): PlateStack {
  const denominations = unit === "kg" ? PLATES_KG : PLATES_LB;
  let perSide = Math.max(0, (totalDisplay - barDisplay) / 2);
  const plates: { plate: number; count: number }[] = [];
  for (const plate of denominations) {
    const count = Math.floor((perSide + 1e-6) / plate);
    if (count > 0) {
      plates.push({ plate, count });
      perSide -= count * plate;
    }
  }
  return { plates, leftover: clean(perSide) };
}

/**
 * The per-side load as a flat list of plate weights — the shape the loader
 * mutates. Seeded from a target weight when the sheet opens.
 */
export function loadFromWeight(
  totalDisplay: number,
  barDisplay: number,
  unit: Unit,
): number[] {
  const { plates } = computePlates(totalDisplay, barDisplay, unit);
  return plates.flatMap(({ plate, count }) =>
    Array.from({ length: count }, () => plate),
  );
}

/** Real loading order: heaviest sits innermost, against the collar. */
export function sortLoad(perSide: number[]): number[] {
  return [...perSide].sort((a, b) => b - a);
}

/** Total on the bar for a per-side load. */
export function stackTotal(perSide: number[], barDisplay: number): number {
  return clean(barDisplay + 2 * perSide.reduce((sum, p) => sum + p, 0));
}

/** How many of each denomination are loaded, for the tray badges. */
export function countsOf(perSide: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const plate of perSide) {
    counts.set(plate, (counts.get(plate) ?? 0) + 1);
  }
  return counts;
}

/** Drop one plate of this denomination; returns a new array. */
export function removeOne(perSide: number[], plate: number): number[] {
  const index = perSide.indexOf(plate);
  if (index === -1) return perSide;
  return [...perSide.slice(0, index), ...perSide.slice(index + 1)];
}

/** Compact "25 · 5 · 1.25" summary of one side, heaviest first. */
export function describeLoad(perSide: number[]): string {
  return sortLoad(perSide).join(" · ");
}

import { clean, type Unit } from "./units";

/** Standard plate denominations available per unit (heaviest first). */
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATES_LB = [45, 35, 25, 10, 5, 2.5];

export interface PlateStack {
  /** plate weight → how many go on ONE side of the bar */
  plates: { plate: number; count: number }[];
  /** per-side weight that couldn't be matched with standard plates */
  leftover: number;
}

/**
 * Default barbell weight in the display unit. Starts empty so the calculator
 * shows the whole target as plates until you dial a bar in.
 */
export function defaultBar(): number {
  return 0;
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

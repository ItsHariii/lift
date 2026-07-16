function canVibrate(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

/** Light tick — set logged, stepper tap. */
export function tick() {
  if (canVibrate()) navigator.vibrate(10);
}

/** Medium confirm — action committed. */
export function confirmBuzz() {
  if (canVibrate()) navigator.vibrate([0, 30]);
}

/** Celebration pattern — new PR. */
export function celebrate() {
  if (canVibrate()) navigator.vibrate([0, 40, 60, 40, 60, 90]);
}

/** Rest timer complete — strong triple. */
export function alarm() {
  if (canVibrate()) navigator.vibrate([0, 200, 120, 200, 120, 200]);
}

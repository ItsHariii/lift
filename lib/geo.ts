export interface LatLng {
  lat: number;
  lng: number;
}

/** Auto-end when further than this from where the session started. */
export const LEAVE_RADIUS_M = 200;

/** Also auto-end a session that has been running longer than this. */
export const MAX_SESSION_MS = 3 * 60 * 60 * 1000; // 3h

/** How often to re-check location while the app is open. */
export const GEO_POLL_MS = 10 * 60 * 1000; // 10 min

/**
 * Read the current device location once. Resolves null (never rejects) when
 * geolocation is unavailable, denied, or times out — callers stay a no-op.
 */
export function captureLocation(): Promise<LatLng | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}

/** Great-circle distance between two points, in metres (haversine). */
export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000; // earth radius, metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

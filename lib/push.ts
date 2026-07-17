/** Client-side Web Push helpers for diet nudges. */

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Requests permission, subscribes via the service worker, and returns the
 * PushSubscription as a single-line JSON string (to paste into the
 * PUSH_SUBSCRIPTION env var). Throws with a user-facing message on failure.
 */
export async function subscribeToNudges(): Promise<string> {
  if (!pushSupported()) {
    throw new Error("Push not supported on this browser.");
  }
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) throw new Error("Missing VAPID public key.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notifications blocked. Enable them for this app.");
  }

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    }));

  return JSON.stringify(sub.toJSON());
}

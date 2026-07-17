import webpush from "web-push";
import { randomNudge } from "@/lib/nudges";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function configured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

export async function GET(request: Request) {
  // Auth: external cron (or Vercel cron) must present the shared secret.
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!configured()) {
    return Response.json(
      { ok: false, error: "VAPID env vars missing" },
      { status: 500 },
    );
  }

  const raw = process.env.PUSH_SUBSCRIPTION;
  if (!raw) {
    return Response.json(
      { ok: false, error: "No PUSH_SUBSCRIPTION set — enable nudges first" },
      { status: 200 },
    );
  }

  let subscription: webpush.PushSubscription;
  try {
    subscription = JSON.parse(raw);
  } catch {
    return Response.json(
      { ok: false, error: "PUSH_SUBSCRIPTION is not valid JSON" },
      { status: 500 },
    );
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const nudge = randomNudge();
  try {
    await webpush.sendNotification(subscription, JSON.stringify(nudge));
    return Response.json({ ok: true, sent: nudge });
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    // 404/410 => subscription expired; don't error-spam the cron.
    if (status === 404 || status === 410) {
      console.warn("[nudge] subscription expired, re-enable in Settings");
      return Response.json({ ok: false, error: "subscription expired" });
    }
    console.error("[nudge] send failed", err);
    return Response.json({ ok: false, error: "send failed" }, { status: 500 });
  }
}

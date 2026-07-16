"use client";

import { useEffect } from "react";
import { ensureSeeded } from "@/lib/seed";

/** Runs once on the client to seed the starter library + settings. */
export default function Boot() {
  useEffect(() => {
    ensureSeeded().catch((e) => console.error("[LIFT] seed failed", e));
    // register service worker (Serwist emits /sw.js at build)
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

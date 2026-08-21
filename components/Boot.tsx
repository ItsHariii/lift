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

  /*
   * In an installed iOS web app the fixed/layout viewport can end short of the
   * physical screen, leaving a strip along the bottom that `bottom: 0`, `inset: 0`
   * and `100dvh` all fail to reach. Nothing in CSS exposes that gap, so measure
   * it and publish it as --viewport-shortfall. Resolves to 0px everywhere else,
   * which makes every rule that consumes it a no-op.
   */
  useEffect(() => {
    const standalone =
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (!standalone) return;

    const sync = () => {
      const gap = Math.round(window.screen.height - window.innerHeight);
      // Ignore nonsense values; a real gap here is tens of points, not hundreds.
      const shortfall = gap > 0 && gap < 200 ? gap : 0;
      document.documentElement.style.setProperty(
        "--viewport-shortfall",
        `${shortfall}px`,
      );
    };

    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  return null;
}

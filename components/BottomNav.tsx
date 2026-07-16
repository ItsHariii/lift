"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: React.ReactNode };

const I = {
  routines: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-5 3 3 5-7" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const items: Item[] = [
  { href: "/routines", label: "Plans", icon: I.routines },
  { href: "/history", label: "History", icon: I.history },
  { href: "/progress", label: "Stats", icon: I.progress },
  { href: "/settings", label: "Setup", icon: I.settings },
];

export default function BottomNav() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
  const logActive = path === "/" || path.startsWith("/log");

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40">
      <div className="mx-auto max-w-md px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="relative flex items-end justify-between rounded-2xl border border-line bg-surface/90 backdrop-blur-xl px-2 py-2 shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.8)]">
          {items.slice(0, 2).map((it) => (
            <Tab key={it.href} item={it} active={isActive(it.href)} />
          ))}

          {/* center LOG action */}
          <Link
            href="/"
            aria-label="Log workout"
            className={`-mt-8 flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border transition-transform active:scale-95 ${
              logActive
                ? "bg-accent border-accent text-black glow"
                : "bg-surface-2 border-line-bright text-accent"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" />
            </svg>
            <span className="label mt-0.5 !text-[0.55rem] !tracking-[0.15em]" style={{ color: logActive ? "#000" : "var(--accent)" }}>
              LOG
            </span>
          </Link>

          {items.slice(2).map((it) => (
            <Tab key={it.href} item={it} active={isActive(it.href)} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function Tab({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
        active ? "text-accent" : "text-text-faint"
      }`}
    >
      <span className="h-5 w-5">{item.icon}</span>
      <span className="label !text-[0.55rem] !tracking-[0.12em]" style={{ color: active ? "var(--accent)" : "var(--text-faint)" }}>
        {item.label}
      </span>
    </Link>
  );
}

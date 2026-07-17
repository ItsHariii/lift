"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: React.ReactNode };

const icons = {
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
  { href: "/routines", label: "Plans", icon: icons.routines },
  { href: "/history", label: "History", icon: icons.history },
  { href: "/progress", label: "Stats", icon: icons.progress },
  { href: "/settings", label: "Setup", icon: icons.settings },
];

export default function BottomNav() {
  const path = usePathname();
  const isActive = (href: string) => path.startsWith(href);
  const logActive = path === "/";

  return (
    <nav className="safe-fixed-inline fixed inset-x-0 bottom-0 z-40 pb-[calc(14px+var(--safe-bottom))]">
      <div className="relative mx-auto flex max-w-[440px] items-end justify-between rounded-[22px] border border-line bg-[rgba(28,24,17,.94)] px-[10px] py-2 shadow-[0_-10px_44px_-14px_rgba(0,0,0,.85)] backdrop-blur-[18px]">
        {items.slice(0, 2).map((item) => (
          <Tab key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <Link
          href="/"
          aria-label="Log workout"
          className={`-mt-[30px] flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[22px] border-2 transition-transform active:scale-95 ${
            logActive
              ? "border-accent bg-accent text-[#1a1206] shadow-[0_0_0_1px_var(--accent),0_0_26px_-4px_var(--accent-glow)]"
              : "border-line-bright bg-surface-2 text-accent"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-[26px] w-[26px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" />
          </svg>
          <span className="display text-[10px] tracking-[0.1em]">LOG</span>
        </Link>

        {items.slice(2).map((item) => (
          <Tab key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>
    </nav>
  );
}

function Tab({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex flex-1 flex-col items-center gap-[5px] py-2 ${active ? "text-accent" : "text-text-faint"}`}
    >
      <span className="h-[22px] w-[22px]">{item.icon}</span>
      <span className="num text-[9px] font-semibold uppercase tracking-[0.14em]">
        {item.label}
      </span>
    </Link>
  );
}

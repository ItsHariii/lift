"use client";

import { useEffect } from "react";

export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 border-0 bg-[rgba(6,5,3,.72)] backdrop-blur-sm"
      />
      <section className="sheet-panel animate-rise relative mx-auto w-full max-w-[440px] rounded-t-[26px] border-t border-line bg-surface">
        <header className="flex items-center justify-between px-5 pb-2 pt-[18px]">
          {title && (
            <h2 className="display text-2xl tracking-[0.02em] uppercase">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="label ml-auto border-0 bg-transparent tracking-[0.2em] text-text-faint"
          >
            Close
          </button>
        </header>
        <div className="sheet-scroll overflow-y-auto px-5 pb-2 pt-2 no-scrollbar">
          {children}
        </div>
      </section>
    </div>
  );
}

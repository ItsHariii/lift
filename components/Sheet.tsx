"use client";

import { createContext, useContext, useEffect } from "react";
import { createPortal } from "react-dom";

const SheetDepthContext = createContext(0);
let bodyLockCount = 0;
let previousBodyOverflow = "";

function lockBody() {
  if (bodyLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  bodyLockCount += 1;
}

function unlockBody() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}

export default function Sheet({
  open,
  onClose,
  title,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const depth = useContext(SheetDepthContext);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    lockBody();
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockBody();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <SheetDepthContext.Provider value={depth + 1}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-frame fixed inset-0 flex flex-col justify-end"
        style={{ zIndex: 50 + depth * 10 }}
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute inset-0 border-0 bg-[rgba(6,5,3,.72)] backdrop-blur-sm"
        />
        <section className="sheet-panel relative mx-auto w-full max-w-[440px] rounded-t-[26px] border-t border-line bg-surface animate-[sheetUp_.34s_cubic-bezier(.22,1,.36,1)_both]">
          <header className="flex shrink-0 items-center justify-between px-5 pb-2 pt-[18px]">
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
          <div className="sheet-scroll px-5 pb-2 pt-2 no-scrollbar">
            {children}
          </div>
          {footer && (
            <footer className="shrink-0 border-t border-line bg-surface px-5 pt-3">
              {footer}
            </footer>
          )}
        </section>
      </div>
    </SheetDepthContext.Provider>,
    document.body,
  );
}

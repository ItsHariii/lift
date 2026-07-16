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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[riseIn_0.2s_ease]"
      />
      <div className="relative mx-auto w-full max-w-md animate-rise rounded-t-3xl border-t border-line bg-surface pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="mx-auto h-1 w-10 rounded-full bg-line-bright absolute left-1/2 -translate-x-1/2 top-2.5" />
          {title && <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto text-text-faint active:text-text text-sm label !tracking-widest"
          >
            Close
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto no-scrollbar px-5 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}

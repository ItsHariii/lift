"use client";

import { useRef, useState } from "react";
import { useSettings, saveSettings } from "@/lib/hooks";
import { downloadBackup, importBackup, clearAll } from "@/lib/backup";
import { ensureSeeded } from "@/lib/seed";
import { confirmBuzz } from "@/lib/haptics";
import PageHeader from "@/components/PageHeader";

const REST_OPTIONS = [60, 90, 120, 180, 240];

export default function SettingsPage() {
  const s = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2500);
  };

  const onImport = async (file: File) => {
    try {
      await importBackup(await file.text());
      flash("Backup restored ✓");
    } catch (e) {
      flash(e instanceof Error ? e.message : "Import failed");
    }
  };

  const reset = async () => {
    if (!confirm("Erase ALL workouts, plans and records? This cannot be undone.")) {
      return;
    }
    await clearAll();
    await ensureSeeded();
    flash("All data cleared");
  };

  return (
    <div>
      <PageHeader title="Setup" />

      {/* units */}
      <Section label="Units">
        <div className="flex gap-2">
          {(["kg", "lb"] as const).map((u) => (
            <button
              key={u}
              onClick={() => {
                saveSettings({ unit: u });
                confirmBuzz();
              }}
              className={`flex-1 rounded-xl border py-3 font-extrabold uppercase tracking-wide transition-colors ${
                s.unit === u
                  ? "border-accent bg-accent text-black"
                  : "border-line text-text-dim"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </Section>

      {/* rest */}
      <Section label="Default rest">
        <div className="flex flex-wrap gap-2">
          {REST_OPTIONS.map((sec) => (
            <button
              key={sec}
              onClick={() => saveSettings({ restSeconds: sec })}
              className={`num rounded-xl border px-4 py-2.5 font-semibold transition-colors ${
                s.restSeconds === sec
                  ? "border-accent bg-accent text-black"
                  : "border-line text-text-dim"
              }`}
            >
              {sec < 60 ? `${sec}s` : `${sec / 60}m${sec % 60 ? "30" : ""}`}
            </button>
          ))}
        </div>
        <Toggle
          label="Auto-start rest timer after each set"
          on={s.autoRest}
          onToggle={() => saveSettings({ autoRest: !s.autoRest })}
        />
      </Section>

      {/* data */}
      <Section label="Data · stored on this device only">
        <button
          onClick={downloadBackup}
          className="w-full rounded-xl border border-line bg-bg py-3 font-semibold text-text active:border-accent active:text-accent"
        >
          Export backup (.json)
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-xl border border-line bg-bg py-3 font-semibold text-text active:border-accent active:text-accent"
        >
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={reset}
          className="w-full rounded-xl border border-danger/40 py-3 font-semibold text-danger active:bg-danger/10"
        >
          Erase all data
        </button>
      </Section>

      <p className="mt-6 text-center text-xs text-text-faint">
        LIFT · offline-first · no account, no cloud
      </p>

      {msg && (
        <div className="fixed inset-x-0 bottom-28 z-50 flex justify-center px-4">
          <div className="animate-pop rounded-full border border-line-bright bg-surface px-5 py-2.5 text-sm font-semibold">
            {msg}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="label mb-2">{label}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-xl border border-line bg-bg px-4 py-3 text-left"
    >
      <span className="pr-4 text-sm font-medium text-text-dim">{label}</span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          on ? "bg-accent" : "bg-line-bright"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-black transition-transform ${
            on ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

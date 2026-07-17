"use client";

import { useRef, useState } from "react";
import { useSettings, saveSettings } from "@/lib/hooks";
import { downloadBackup, importBackup, clearAll } from "@/lib/backup";
import { ensureSeeded } from "@/lib/seed";
import { confirmBuzz } from "@/lib/haptics";
import PageHeader from "@/components/PageHeader";

const REST_OPTIONS = [60, 90, 120, 180, 240];

export default function SettingsPage() {
  const settings = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const flash = (nextMessage: string) => {
    setMessage(nextMessage);
    setTimeout(() => setMessage(null), 2500);
  };

  const onImport = async (file: File) => {
    try {
      await importBackup(await file.text());
      flash("Backup restored");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Import failed");
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
    <div className="animate-rise">
      <PageHeader title="Setup" />

      <Section label="Units">
        <div className="flex gap-2">
          {(["kg", "lb"] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => {
                saveSettings({ unit });
                confirmBuzz();
              }}
              className={`display flex-1 rounded-[14px] border py-3.5 text-xl uppercase tracking-[0.04em] ${
                settings.unit === unit
                  ? "border-accent bg-accent text-[#1a1206]"
                  : "border-line bg-transparent text-text-dim"
              }`}
            >
              {unit}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Default rest">
        <div className="mb-3 flex flex-wrap gap-2">
          {REST_OPTIONS.map((seconds) => (
            <button
              key={seconds}
              onClick={() => saveSettings({ restSeconds: seconds })}
              className={`num rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                settings.restSeconds === seconds
                  ? "border-accent bg-accent text-[#1a1206]"
                  : "border-line bg-transparent text-text-dim"
              }`}
            >
              {formatRest(seconds)}
            </button>
          ))}
        </div>
        <Toggle
          label="Auto-start rest timer after each set"
          on={settings.autoRest}
          onToggle={() => saveSettings({ autoRest: !settings.autoRest })}
        />
      </Section>

      <Section label="Data · stored on this device only">
        <div className="flex flex-col gap-2">
          <button
            onClick={downloadBackup}
            className="w-full rounded-[14px] border border-line bg-bg-2 py-3.5 text-sm font-bold text-text active:border-accent active:text-accent"
          >
            Export backup (.json)
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-[14px] border border-line bg-bg-2 py-3.5 text-sm font-bold text-text active:border-accent active:text-accent"
          >
            Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = "";
            }}
          />
          <button
            onClick={reset}
            className="w-full rounded-[14px] border border-[rgba(255,87,71,.4)] bg-transparent py-3.5 text-sm font-bold text-danger active:bg-[rgba(255,87,71,.1)]"
          >
            Erase all data
          </button>
        </div>
      </Section>

      <p className="num text-center text-[11px] uppercase tracking-[0.12em] text-text-faint">
        LIFT · offline-first · no account, no cloud
      </p>

      {message && (
        <div className="safe-fixed-inline fixed inset-x-0 bottom-[calc(104px+var(--safe-bottom))] z-[55] flex justify-center">
          <div className="animate-pop rounded-full border border-line-bright bg-surface px-[22px] py-[11px] text-sm font-bold">
            {message}
          </div>
        </div>
      )}
    </div>
  );
}

function formatRest(seconds: number) {
  const minutes = seconds / 60;
  return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)}m`;
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-[26px]">
      <div className="label mb-2.5">{label}</div>
      {children}
    </section>
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
      className="flex w-full items-center justify-between rounded-[14px] border border-line bg-bg-2 px-4 py-3.5 text-left"
    >
      <span className="pr-4 text-sm font-medium text-text-dim">{label}</span>
      <span
        className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-line-bright"}`}
      >
        <span
          className={`absolute top-[3px] h-5 w-5 rounded-full bg-[#1a1206] transition-[left] ${on ? "left-[23px]" : "left-[3px]"}`}
        />
      </span>
    </button>
  );
}

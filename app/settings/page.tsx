"use client";

import Link from "next/link";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";

export default function SettingsPage() {
  const { account } = useVulcanSession();

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="workspace-card rounded-2xl p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Dziennik</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[var(--text)]">EduVULCAN</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          Połącz Kandex z kontem VULCAN, aby automatycznie pobierać oceny, zadania,
          sprawdziany i plan lekcji.
        </p>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-[var(--surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</p>
            <p className="mt-1 text-sm font-bold text-[var(--text)]">
              {account ? `Połączono jako ${account.fullName}` : "Brak połączenia"}
            </p>
          </div>
          <Link href={account ? "/subjects" : "/login"} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-bold text-white">
            {account ? "Zobacz oceny" : "Połącz z EduVULCAN →"}
          </Link>
        </div>
      </div>

      <div className="workspace-card rounded-2xl p-6">
        <h2 className="text-lg font-extrabold text-[var(--text)]">Co jest importowane?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ["✓", "Oceny", "Wszystkie dostępne oceny i średnie ważone."],
            ["▣", "Plan lekcji", "Lekcje z najbliższych 60 dni."],
            ["!", "Sprawdziany", "Terminy egzaminów i sprawdzianów."],
            ["⌁", "Zadania", "Prace domowe i ich terminy."],
          ].map(([icon, title, text]) => (
            <div key={title} className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <span className="text-lg text-[var(--accent)]">{icon}</span>
              <h3 className="mt-2 text-sm font-bold text-[var(--text)]">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-bold text-amber-900">Ważne</p>
        <p className="mt-1 text-xs leading-5 text-amber-800">
          Kandex nie potrzebuje Twojego hasła do portalu. Logowanie programistyczne
          korzysta z mechanizmu dostępu mobilnego VULCAN.
        </p>
      </div>
    </div>
  );
}

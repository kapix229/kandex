"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";

export default function SettingsPage() {
  const { account } = useVulcanSession();
  const [provider, setProvider] = useState<"eduvulcan" | "librus">("eduvulcan");

  useEffect(() => {
    const savedProvider = window.localStorage.getItem("kandex-journal-provider");
    if (savedProvider === "eduvulcan" || savedProvider === "librus") {
      setProvider(savedProvider);
    }
  }, []);

  function selectProvider(nextProvider: "eduvulcan" | "librus") {
    console.info("[Kandex provider] Click:", nextProvider);
    try {
      window.localStorage.setItem("kandex-journal-provider", nextProvider);
      console.info(
        "[Kandex provider] Stored value:",
        window.localStorage.getItem("kandex-journal-provider"),
        "| origin:",
        window.location.origin,
      );
    } catch (error) {
      console.error("[Kandex provider] localStorage write failed:", error);
    }
    setProvider(nextProvider);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="workspace-card rounded-2xl p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Konfiguracja dziennika</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[var(--text)]">Wybierz dziennik</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          Wybierz dostawcę, z którego korzystasz w szkole. Obecnie aktywne logowanie i import obsługuje EduVULCAN.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={provider === "eduvulcan"}
            onClick={() => selectProvider("eduvulcan")}
            className={`rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${provider === "eduvulcan" ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]" : "border-[var(--border)] bg-white hover:bg-[var(--surface-muted)]"}`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-bold text-[var(--text)]">EduVULCAN</span>
              <span className="text-sm font-bold text-[var(--accent)]">{provider === "eduvulcan" ? "✓ Wybrano" : "Wybierz"}</span>
            </span>
            <span className="mt-2 block text-xs leading-5 text-[var(--text-muted)]">Logowanie i synchronizacja danych szkolnych.</span>
          </button>

          <button
            type="button"
            aria-pressed={provider === "librus"}
            onClick={() => selectProvider("librus")}
            className={`rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${provider === "librus" ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]" : "border-[var(--border)] bg-white hover:bg-[var(--surface-muted)]"}`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-bold text-[var(--text)]">Librus</span>
              <span className="text-xs font-bold text-[var(--text-muted)]">{provider === "librus" ? "✓ Wybrano" : "Wkrótce"}</span>
            </span>
            <span className="mt-2 block text-xs leading-5 text-[var(--text-muted)]">Integracja Librus nie jest jeszcze aktywna.</span>
          </button>
        </div>

        {provider === "eduvulcan" ? (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[var(--surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Status połączenia</p>
              <p className="mt-1 text-sm font-bold text-[var(--text)]">
                {account ? `Połączono jako ${account.fullName}` : "Brak połączenia"}
              </p>
            </div>
            <Link href={account ? "/subjects" : "/login"} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-bold text-white">
              {account ? "Zobacz oceny" : "Połącz z EduVULCAN →"}
            </Link>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Librus można wybrać, ale logowanie nie jest jeszcze dostępne. Wybierz EduVULCAN, aby kontynuować konfigurację.
          </p>
        )}
      </div>

      <div className="workspace-card rounded-2xl p-6">
        <h2 className="text-lg font-extrabold text-[var(--text)]">Co importuje EduVULCAN?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ["✓", "Oceny", "Dostępne oceny i średnie."],
            ["▣", "Plan lekcji", "Dane planu lekcji udostępnione przez dziennik."],
            ["!", "Sprawdziany", "Terminy sprawdzianów, jeśli są dostępne."],
            ["⌁", "Zadania", "Prace domowe, jeśli są dostępne."],
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
        <p className="text-sm font-bold text-amber-900">Bezpieczeństwo</p>
        <p className="mt-1 text-xs leading-5 text-amber-800">
          Dane logowania są wysyłane do serwera Kandex przez HTTPS. Nie udostępniaj hasła w rozmowie ani w plikach projektu.
        </p>
      </div>
    </div>
  );
}

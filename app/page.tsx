"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import CalendarMini from "@/src/components/CalendarMini";

export default function HomePage() {
  const { account } = useVulcanSession();
  const [provider, setProvider] = useState<"eduvulcan" | "librus" | null>(null);

  useEffect(() => {
    const savedProvider = window.localStorage.getItem("kandex-journal-provider");
    if (savedProvider === "eduvulcan" || savedProvider === "librus") {
      setProvider(savedProvider);
    }
  }, []);

  function selectProvider(nextProvider: "eduvulcan" | "librus") {
    console.info("[Kandex provider] Home click:", nextProvider);
    try {
      window.localStorage.setItem("kandex-journal-provider", nextProvider);
      console.info(
        "[Kandex provider] Home stored value:",
        window.localStorage.getItem("kandex-journal-provider"),
        "| origin:",
        window.location.origin,
      );
    } catch (error) {
      console.error("[Kandex provider] Home localStorage write failed:", error);
    }
    setProvider(nextProvider);
  }

  if (!account) {
    return (
      <main className="min-h-screen px-5 py-8 sm:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center">
          <div className="mb-12 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent)] text-lg font-black text-white">K</span>
            <div>
              <p className="text-xl font-extrabold tracking-tight">Kandex</p>
              <p className="text-xs text-[var(--text-muted)]">Twój workspace do nauki</p>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <section>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Krok 01 · konfiguracja</p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-[var(--text)] sm:text-6xl">
                Zacznij od swojego dziennika.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
                Kandex łączy dane szkolne z planem nauki. Wybierz dziennik, połącz konto, a resztę danych przygotujemy automatycznie.
              </p>
            </section>

            <section className="workspace-card rounded-[30px] p-5 sm:p-7">
              <div className="mb-6">
                <p className="text-sm font-extrabold text-[var(--text)]">Z którego dziennika korzystasz?</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Możesz później zmienić dostawcę w ustawieniach.</p>
              </div>

              <div className="space-y-3">
                <button type="button" aria-pressed={provider === "eduvulcan"} onClick={() => selectProvider("eduvulcan")} className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${provider === "eduvulcan" ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]" : "border-[var(--border)] bg-white hover:bg-[var(--surface-muted)]"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[var(--text)]">EduVULCAN</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">Połączenie przez oficjalny dostęp mobilny</p>
                    </div>
                    <span className="text-[var(--accent)]">→</span>
                  </div>
                </button>

                <button type="button" aria-pressed={provider === "librus"} onClick={() => selectProvider("librus")} className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${provider === "librus" ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]" : "border-[var(--border)] bg-white hover:bg-[var(--surface-muted)]"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[var(--text)]">Librus</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">Adapter przygotowany · integracja wkrótce</p>
                    </div>
                    <span className="text-xs font-bold text-[var(--text-muted)]">WKRÓTCE</span>
                  </div>
                </button>
              </div>

              {provider === "eduvulcan" && (
                <div className="mt-5">
                  <Link href="/login" className="block w-full rounded-2xl bg-[var(--accent)] px-4 py-3.5 text-center text-sm font-bold text-white transition hover:brightness-105">
                    Połącz EduVULCAN →
                  </Link>
                  <p className="mt-3 text-center text-[11px] leading-5 text-[var(--text-muted)]">
                    Logujesz się standardowo loginem i hasłem. Kandex nie zapisuje tych danych w przeglądarce.
                  </p>
                </div>
              )}

              {provider === "librus" && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                  Integracja Librus jest już wydzielona jako osobny provider, ale nie jest jeszcze aktywna. Nie będziemy udawać logowania, dopóki bezpieczny adapter nie będzie gotowy.
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    );
  }

  const firstName = account.fullName?.split(" ")[0] || "Uczniu";
  const cards = [
    ["▣", "Plan lekcji", "Sprawdź najbliższe lekcje", "/calendar"],
    ["✓", "Oceny", "Zobacz średnie i szczegóły", "/subjects"],
    ["✦", "Nauka", "Przejdź do materiałów i AI", "#ai"],
  ];

  return (
    <div className="animate-fade-in space-y-7">
      <header>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Dashboard</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">Cześć, {firstName} 👋</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">Twoje dane szkolne i nauka w jednym miejscu.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map(([icon, title, text, href]) => (
          <Link key={title} href={href} className="workspace-card rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(52,55,48,0.10)]">
            <span className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-[var(--surface-muted)] text-lg font-bold text-[var(--accent)]">{icon}</span>
            <h2 className="font-bold text-[var(--text)]">{title}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{text}</p>
            <span className="mt-4 inline-block text-xs font-bold text-[var(--accent)]">Otwórz →</span>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="workspace-card rounded-2xl p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Plan</p>
              <h2 className="mt-1 text-xl font-extrabold text-[var(--text)]">Twój tydzień</h2>
            </div>
            <Link href="/calendar" className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-bold text-[var(--text)]">Pełny widok</Link>
          </div>
          <CalendarMini />
        </div>

        <aside className="workspace-card h-fit rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Połączenie</p>
          <h2 className="mt-1 text-lg font-extrabold text-[var(--text)]">EduVULCAN</h2>
          <p className="mt-2 text-xs font-semibold text-[var(--success)]">Połączony · {account.fullName}</p>
          <Link href="/settings" className="mt-5 block rounded-xl bg-[var(--surface-muted)] px-3 py-3 text-xs font-bold text-[var(--text)]">Ustawienia dziennika →</Link>
        </aside>
      </section>
    </div>
  );
}
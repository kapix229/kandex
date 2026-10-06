"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";

type Student = {
  id: number;
  fullName: string;
  className: string;
  schoolName: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useVulcanSession();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitCredentials(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/journal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "eduvulcan", username, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error ?? "Nie udało się zalogować.");
        return;
      }

      if (data.account) signIn(data.account);

      const imported = await fetch("/api/journal/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "eduvulcan" }),
      });

      if (!imported.ok) {
        setError("Zalogowano, ale import danych nie powiódł się.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Nie udało się połączyć z serwerem Kandex.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-xl items-center justify-center py-10">
      <div className="workspace-card w-full rounded-[28px] p-6 sm:p-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-white">K</span>
            Kandex
          </Link>
          <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Połączenie z dziennikiem
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--text)]">
            Zaloguj EduVULCAN
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            Kandex korzysta z oficjalnego mechanizmu dostępu mobilnego VULCAN.
            Nie zapisujemy Twojego hasła ani tokena w przeglądarce.
          </p>
        </div>

        <div className="mb-7 flex gap-2">
          {[
            ["credentials", "1", "Dane"],
            ["pin", "2", "PIN"],
            ["student", "3", "Uczeń"],
          ].map(([key, number, label]) => (
            <div key={key} className="flex-1">
              <div className={`h-1.5 rounded-full ${step === key ? "bg-[var(--accent)]" : "bg-[var(--surface-muted)]"}`} />
              <p className="mt-2 text-[11px] font-bold text-[var(--text-muted)]">{number}. {label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {step === "credentials" && (
          <form onSubmit={submitCredentials} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--text)]">Token bezpieczeństwa</label>
              <input
                value={securityToken}
                onChange={(e) => setSecurityToken(e.target.value.toUpperCase())}
                autoComplete="off"
                spellCheck={false}
                required
                placeholder="np. ABC..."
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
              />
              <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                Znajdziesz go w swoim dzienniku w sekcji „Dostęp mobilny”.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--text)]">Symbol szkoły / jednostki</label>
              <input
                value={schoolSymbol}
                onChange={(e) => setSchoolSymbol(e.target.value.toLowerCase())}
                autoComplete="off"
                spellCheck={false}
                required
                placeholder="np. sieradz"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
              />
              <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                To identyfikator widoczny w adresie Twojego dziennika. Jeśli masz adres
                <span className="font-semibold"> uonetplus.vulcan.net.pl/symbol</span>, wpisz jego końcówkę.
              </p>
            </div>

            <button disabled={loading} className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60">
              {loading ? "Sprawdzanie..." : "Dalej →"}
            </button>
          </form>
        )}

        {step === "pin" && (
          <form onSubmit={submitPin} className="space-y-5">
            <div className="rounded-2xl bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--text-muted)]">
              Dane zostały zweryfikowane. Teraz podaj 4-cyfrowy PIN wymagany przez
              VULCAN do zarejestrowania Kandex jako urządzenia mobilnego.
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--text)]">PIN</label>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                required
                autoFocus
                placeholder="••••"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-center text-3xl font-black tracking-[0.5em] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => { setStep("credentials"); setError(""); }} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5 text-sm font-bold text-[var(--text)]">
                Wróć
              </button>
              <button disabled={loading} className="rounded-2xl bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60">
                {loading ? "Łączenie..." : "Połącz"}
              </button>
            </div>
          </form>
        )}

        {step === "student" && (
          <form onSubmit={submitStudent} className="space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-[var(--text)]">Wybierz ucznia</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                To konto ma dostęp do więcej niż jednego ucznia.
              </p>
            </div>

            <div className="space-y-2">
              {students.map((student) => (
                <label key={student.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${selectedStudent === String(student.id) ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-white hover:bg-[var(--surface-muted)]"}`}>
                  <input
                    type="radio"
                    name="student"
                    value={student.id}
                    checked={selectedStudent === String(student.id)}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[var(--text)]">{student.fullName}</span>
                    <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{student.className} · {student.schoolName}</span>
                  </span>
                </label>
              ))}
            </div>

            <button disabled={loading || !selectedStudent} className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60">
              {loading ? "Wybieranie..." : "Otwórz Kandex →"}
            </button>
          </form>
        )}

        <p className="mt-7 border-t border-[var(--border)] pt-5 text-xs leading-5 text-[var(--text-muted)]">
          Nie masz jeszcze tokena dostępu mobilnego? Otwórz panel swojego Dziennika
          VULCAN i przejdź do sekcji dotyczącej dostępu mobilnego.
        </p>
      </div>
    </div>
  );
}

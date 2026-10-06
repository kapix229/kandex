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
          <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Połączenie z dziennikiem</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--text)]">Zaloguj EduVULCAN</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Podaj login i hasło do swojego dziennika. Dane logowania nie są zapisywane w przeglądarce.</p>
        </div>
        {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        <form onSubmit={submitCredentials} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-[var(--text)]">Login</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required placeholder="Twój login" className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[var(--text)]">Hasło</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required placeholder="Twoje hasło" className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]" />
          </div>
          <button disabled={loading} className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60">{loading ? "Logowanie i import..." : "Zaloguj i zaimportuj dane →"}</button>
        </form>
        <p className="mt-7 border-t border-[var(--border)] pt-5 text-xs leading-5 text-[var(--text-muted)]">Po udanym połączeniu Kandex przygotuje w aplikacji oceny, plan lekcji i zadania.</p>
      </div>
    </div>
  );
}

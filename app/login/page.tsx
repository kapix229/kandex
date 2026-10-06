"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useVulcanSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [jwtToken, setJwtToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitCredentials(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/journal/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "eduvulcan", username, password }) });
      const data = await response.json();
      if (!response.ok || !data.success) { setError(data.error ?? "Nie udało się zalogować."); return; }
      if (data.account) signIn(data.account);
      router.replace("/");
      router.refresh();
    } catch {
      setError("Nie udało się połączyć z serwerem Kandex.");
    } finally {
      setLoading(false);
    }
  }

  async function submitMobileToken(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/journal/mobile-connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jwtToken }) });
      const data = await response.json();
      if (!response.ok || !data.success) { setError(data.error ?? "Nie udało się połączyć z mobilnym API."); return; }
      if (data.account) signIn(data.account);
      const imported = await fetch("/api/journal/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "eduvulcan" }) });
      const importedData = await imported.json();
      if (!imported.ok || !importedData.success) { setError(importedData.error ?? "Połączenie działa, ale import danych się nie udał."); return; }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Nie udało się połączyć z serwerem Kandex.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl items-center justify-center py-10">
      <div className="workspace-card w-full rounded-[28px] p-6 sm:p-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-white">K</span>Kandex</Link>
          <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Połączenie z dziennikiem</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--text)]">Połącz EduVULCAN</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Kandex ma teraz osobny adapter mobilnego API. Dzięki temu możemy testować prawdziwy import bez automatycznego wpisywania hasła na stronie EduVULCAN.</p>
        </div>
        {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="font-bold text-[var(--text)]">Test mobilnego API</h2><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Wklej jednorazowo JWT ucznia z mobilnego przepływu EduVULCAN. Token nie jest zapisywany w repozytorium.</p></div><span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">TEST</span></div>
          <form onSubmit={submitMobileToken} className="space-y-4">
            <textarea value={jwtToken} onChange={(e) => setJwtToken(e.target.value)} required rows={5} placeholder="eyJ..." className="w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-mono text-xs outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]" />
            <button disabled={loading} className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60">{loading ? "Łączenie i pobieranie..." : "Połącz mobilne API i pobierz dane →"}</button>
          </form>
        </section>

        <details className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-5">
          <summary className="cursor-pointer text-sm font-bold text-[var(--text)]">Login + hasło</summary>
          <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">Ten wariant pozostaje przygotowany w architekturze, ale nie wysyła hasła automatycznie do portalu. Używamy mobilnego API do właściwego testu integracji.</p>
          <form onSubmit={submitCredentials} className="mt-4 space-y-4">
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required placeholder="Login" className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required placeholder="Hasło" className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]" />
            <button disabled={loading} className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-bold text-[var(--text)] disabled:opacity-60">Spróbuj logowania loginem i hasłem</button>
          </form>
        </details>

        <p className="mt-6 border-t border-[var(--border)] pt-5 text-xs leading-5 text-[var(--text-muted)]">Po udanym połączeniu importujemy oceny, plan lekcji i zadania do ujednoliconego modelu Kandex.</p>
      </div>
    </div>
  );
}
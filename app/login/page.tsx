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
    setError(""); setLoading(true);
    try {
      const response = await fetch("/api/eduvulcan/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json() as {
        success?: boolean;
        account?: { fullName: string; studentId?: number };
        error?: { message?: string };
      };
      if (!response.ok || !data.success) { setError(data.error?.message ?? "Nie udało się zalogować."); return; }

      if (data.account) signIn(data.account);
      router.replace("/"); router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się połączyć z serwerem Kandex.");
    } finally { setLoading(false); }
  }

  async function submitMobileToken(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/journal/mobile-connect", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jwtToken }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) { setError(data.error ?? "Nie udało się połączyć z mobilnym API."); return; }
      if (data.account) signIn(data.account);
      router.replace("/"); router.refresh();
    } catch { setError("Nie udało się połączyć z serwerem Kandex."); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl items-center justify-center py-10">
      <div className="workspace-card w-full rounded-[28px] p-6 sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-white">K</span>Kandex</Link>
        <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Połączenie z dziennikiem</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--text)]">Połącz EduVULCAN</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Kandex wykona wymagane zabezpieczenie CAPTCHA na serwerze i przekaże wynik do EduVULCAN.</p>

        {error && <div className="my-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="font-bold text-[var(--text)]">Logowanie</h2>
          <form onSubmit={submitCredentials} className="mt-5 space-y-4">
            <input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required placeholder="Login" className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" />
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" required placeholder="Hasło" className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" />
            <button disabled={loading} className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-60">{loading ? "Logowanie..." : "Zaloguj do EduVULCAN →"}</button>
          </form>
        </section>

        <details className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-5">
          <summary className="cursor-pointer text-sm font-bold">Tryb techniczny — JWT mobilnego API</summary>
          <form onSubmit={submitMobileToken} className="mt-4 space-y-4">
            <textarea value={jwtToken} onChange={e => setJwtToken(e.target.value)} required rows={5} placeholder="eyJ..." className="w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-mono text-xs" />
            <button disabled={loading} className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-bold">Połącz tokenem diagnostycznym</button>
          </form>
        </details>
      </div>
    </div>
  );
}

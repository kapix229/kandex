"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type AttendanceStatus = "present" | "absent" | "late" | "excused" | "unknown";
type AttendanceEntry = {
  date: string;
  lesson: number;
  subject: string;
  status: AttendanceStatus;
};
type AttendanceResponse = {
  success: boolean;
  data?: {
    summary: { present: number; absent: number; late: number; excused: number; unknown: number };
    entries: AttendanceEntry[];
  };
  error?: { message?: string };
};

const STATUS: Record<AttendanceStatus, { label: string; className: string }> = {
  present: { label: "Obecny", className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" },
  absent: { label: "Nieobecny", className: "border-rose-500/25 bg-rose-500/10 text-rose-300" },
  late: { label: "Spóźnienie", className: "border-amber-500/25 bg-amber-500/10 text-amber-200" },
  excused: { label: "Usprawiedliwione", className: "border-sky-500/25 bg-sky-500/10 text-sky-200" },
  unknown: { label: "Brak statusu", className: "border-[var(--border)] bg-white/[0.04] text-[var(--text-muted)]" },
};

function formatDate(value: string) {
  if (!value) return "Brak daty";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pl-PL", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default function AttendancePage() {
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, excused: 0, unknown: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | AttendanceStatus>("all");
  const [search, setSearch] = useState("");

  const loadAttendance = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/eduvulcan/attendance", { cache: "no-store" });
      const result = (await response.json()) as AttendanceResponse;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error?.message ?? "Nie udało się pobrać frekwencji.");
      }
      setEntries(result.data.entries ?? []);
      setSummary(result.data.summary ?? { present: 0, absent: 0, late: 0, excused: 0, unknown: 0 });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Wystąpił błąd podczas pobierania frekwencji.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialLoad() {
      try {
        const response = await fetch("/api/eduvulcan/attendance", { cache: "no-store" });
        const result = (await response.json()) as AttendanceResponse;
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error?.message ?? "Nie udało się pobrać frekwencji.");
        }
        if (cancelled) return;
        setEntries(result.data.entries ?? []);
        setSummary(result.data.summary ?? { present: 0, absent: 0, late: 0, excused: 0 });
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Wystąpił błąd podczas pobierania frekwencji.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void initialLoad();
    return () => { cancelled = true; };
  }, []);

  const total = summary.present + summary.absent + summary.late + summary.excused + summary.unknown;
  const presenceRate = total ? Math.round(((summary.present + summary.late) / total) * 100) : 0;
  const filteredEntries = useMemo(() => entries
    .filter((entry) => filter === "all" || entry.status === filter)
    .filter((entry) => `${entry.subject} ${entry.date}`.toLocaleLowerCase("pl-PL").includes(search.toLocaleLowerCase("pl-PL")))
    .sort((a, b) => b.date.localeCompare(a.date) || b.lesson - a.lesson), [entries, filter, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Kandex / EduVULCAN</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--text)]">Frekwencja</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">Obecności, nieobecności i spóźnienia zsynchronizowane z dziennikiem.</p>
        </div>
        <button type="button" onClick={() => void loadAttendance(true)} disabled={loading || refreshing} className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] hover:border-[var(--accent)] disabled:opacity-60">
          {refreshing ? "Odświeżanie…" : "↻ Odśwież dane"}
        </button>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-rose-400/25 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-200">{error}</div>}

      {loading ? (
        <div className="workspace-card rounded-2xl p-12 text-center text-sm text-[var(--text-muted)]">Pobieranie frekwencji z EduVULCAN…</div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-6">
            <div className="workspace-card col-span-2 rounded-2xl p-5 xl:col-span-1">
              <p className="text-sm text-[var(--text-muted)]">Frekwencja</p>
              <p className="mt-2 text-3xl font-extrabold text-[var(--text)]">{total ? `${presenceRate}%` : "—"}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${presenceRate}%` }} />
              </div>
            </div>
            {([
              ["Obecności", summary.present, "text-emerald-300"],
              ["Nieobecności", summary.absent, "text-rose-300"],
              ["Spóźnienia", summary.late, "text-amber-200"],
              ["Usprawiedliwione", summary.excused, "text-sky-200"],
              ["Nieznany status", summary.unknown, "text-[var(--text-muted)]"],
            ] as const).map(([label, value, color]) => (
              <div key={label} className="workspace-card rounded-2xl p-5">
                <p className="text-sm text-[var(--text-muted)]">{label}</p>
                <p className={`mt-2 text-3xl font-extrabold ${color}`}>{value}</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">lekcji</p>
              </div>
            ))}
          </section>

          <section className="workspace-card overflow-hidden rounded-2xl">
            <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-[var(--text)]">Historia frekwencji</h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{filteredEntries.length} wpisów</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input aria-label="Szukaj przedmiotu lub daty" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Szukaj przedmiotu…" className="min-w-0 rounded-xl border px-3 py-2 text-sm sm:w-52" />
                <select aria-label="Filtr statusu" value={filter} onChange={(event) => setFilter(event.target.value as "all" | AttendanceStatus)} className="rounded-xl border px-3 py-2 text-sm">
                  <option value="all">Wszystkie statusy</option>
                  <option value="present">Obecności</option>
                  <option value="absent">Nieobecności</option>
                  <option value="late">Spóźnienia</option>
                  <option value="excused">Usprawiedliwione</option>
                  <option value="unknown">Brak statusu</option>
                </select>
              </div>
            </div>
            {filteredEntries.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-[var(--text)]">{entries.length ? "Brak wpisów pasujących do filtra" : "Brak danych frekwencji"}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{entries.length ? "Zmień wyszukiwaną frazę lub status." : "Dziennik nie zwrócił wpisów. Spróbuj odświeżyć dane; jeśli problem się powtarza, import frekwencji wymaga sprawdzenia."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-left text-sm">
                  <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                    <tr><th className="px-5 py-3 font-semibold">Data</th><th className="px-5 py-3 font-semibold">Przedmiot</th><th className="px-5 py-3 font-semibold">Lekcja</th><th className="px-5 py-3 font-semibold">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredEntries.map((entry, index) => (
                      <tr key={`${entry.date}-${entry.lesson}-${entry.subject}-${index}`} className="transition-colors hover:bg-white/[0.025]">
                        <td className="whitespace-nowrap px-5 py-3.5 text-[var(--text-muted)]">{formatDate(entry.date)}</td>
                        <td className="px-5 py-3.5 font-medium text-[var(--text)]">{entry.subject || "Lekcja"}</td>
                        <td className="px-5 py-3.5 text-[var(--text-muted)]">{entry.lesson || "—"}</td>
                        <td className="px-5 py-3.5"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS[entry.status]?.className ?? STATUS.unknown.className}`}>{STATUS[entry.status]?.label ?? STATUS.unknown.label}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">Dane pochodzą z ostatniej synchronizacji EduVULCAN. Procent liczony jest ze wszystkich wpisów frekwencji. Obecności i spóźnienia są liczone jako obecność; nieznane statusy pozostają w mianowniku, aby nie zawyżać wyniku.</p>
        </>
      )}
    </div>
  );
}

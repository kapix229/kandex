"use client";

import { useEffect, useState } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import { VulcanGrade, VulcanGradeSummary } from "@/types/vulcan";

type GradesResponse = {
  success: boolean;
  summaries?: Array<Omit<VulcanGradeSummary, "grades"> & {
    grades: Array<Omit<VulcanGrade, "date"> & { date: string }>;
  }>;
  error?: string;
};

const GRADE_COLORS: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-yellow-500",
  4: "bg-lime-500",
  5: "bg-green-500",
  6: "bg-emerald-600",
};

const GRADE_BG: Record<number, string> = {
  1: "bg-red-50 border-red-200 text-red-700",
  2: "bg-orange-50 border-orange-200 text-orange-700",
  3: "bg-yellow-50 border-yellow-200 text-yellow-700",
  4: "bg-lime-50 border-lime-200 text-lime-700",
  5: "bg-green-50 border-green-200 text-green-700",
  6: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

function gradeChipClass(value: number): string {
  const clamped = Math.min(6, Math.max(1, Math.round(value)));
  return GRADE_BG[clamped] ?? "bg-zinc-50 border-zinc-200 text-zinc-700";
}

function gradeDotClass(value: number): string {
  const clamped = Math.min(6, Math.max(1, value));
  return GRADE_COLORS[clamped] ?? "bg-zinc-500";
}

export default function SubjectsPage() {
  const { account, signOut } = useVulcanSession();
  const [summaries, setSummaries] = useState<VulcanGradeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  async function handleLogout() {
    try {
      await fetch("/api/vulcan/login", { method: "DELETE" });
    } catch (err) {
      console.error("logout failed:", err);
    } finally {
      signOut();
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/vulcan/grades");
        const data: GradesResponse = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.success) {
          setError(data.error ?? "Nie udało się pobrać ocen.");
          setSummaries([]);
          return;
        }

        const parsed: VulcanGradeSummary[] = (data.summaries ?? []).map((s) => ({
          subject: s.subject,
          average: s.average,
          count: s.count,
          grades: s.grades.map((g) => ({ ...g, date: new Date(g.date) })),
        }));

        // Sort by average descending (best subjects first).
        parsed.sort((a, b) => b.average - a.average);

        setSummaries(parsed);
        if (parsed.length > 0) setSelectedSubject(parsed[0].subject);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Nieznany błąd";
        setError(`Błąd sieci: ${message}`);
        setSummaries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Overall average across all subjects (unweighted mean of subject averages).
  const overallAverage =
    summaries.length > 0
      ? summaries.reduce((s, x) => s + x.average, 0) / summaries.length
      : 0;

  const totalGrades = summaries.reduce((s, x) => s + x.count, 0);
  const activeSummary =
    summaries.find((s) => s.subject === selectedSubject) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-zinc-800 mb-2">Oceny</h1>
          <p className="text-zinc-600 text-sm">
            Dziennik ocen zsynchronizowany z Twoim kontem Vulcan
          </p>
        </div>
        {account && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">
              Zalogowano jako <span className="font-semibold">{account.fullName}</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-white border border-zinc-300 text-zinc-700 px-3 py-1.5 rounded-lg text-sm hover:bg-zinc-50"
            >
              Wyloguj
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-white border border-zinc-200 text-zinc-600 rounded-lg px-4 py-3 text-sm">
          Dziennik jest pusty. Gdy pojawi się automatyczny import z Vulcana, oceny pojawią się tutaj.
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-zinc-500">
          Dziennik jest pusty.
        </div>
      ) : summaries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-zinc-500">
          Brak ocen do wyświetlenia. Dziennik oczekuje na automatyczny import.
        </div>
      ) : (
        <>
          {/* Overall stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <p className="text-sm text-zinc-500 mb-1">Średnia ogólna</p>
              <p className="text-3xl font-extrabold text-zinc-800">
                {overallAverage.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <p className="text-sm text-zinc-500 mb-1">Przedmioty</p>
              <p className="text-3xl font-extrabold text-zinc-800">
                {summaries.length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <p className="text-sm text-zinc-500 mb-1">Wszystkie oceny</p>
              <p className="text-3xl font-extrabold text-zinc-800">
                {totalGrades}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subject list */}
            <div className="space-y-2">
              {summaries.map((s) => {
                const isActive = s.subject === selectedSubject;
                return (
                  <button
                    key={s.subject}
                    onClick={() => setSelectedSubject(s.subject)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      isActive
                        ? "bg-blue-50 border-blue-300 shadow-sm"
                        : "bg-white border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`font-semibold ${
                            isActive ? "text-blue-900" : "text-zinc-800"
                          }`}
                        >
                          {s.subject}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {s.count} {s.count === 1 ? "ocena" : "ocen"}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-lg text-lg font-bold ${gradeChipClass(
                          s.average
                        )}`}
                      >
                        {s.average.toFixed(2)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Grades list for selected subject */}
            <div className="lg:col-span-2">
              {activeSummary ? (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-zinc-800">
                      {activeSummary.subject}
                    </h2>
                    <div
                      className={`px-4 py-2 rounded-lg text-2xl font-bold ${gradeChipClass(
                        activeSummary.average
                      )}`}
                    >
                      {activeSummary.average.toFixed(2)}
                    </div>
                  </div>

                  <p className="text-sm text-zinc-500 mb-4">
                    {activeSummary.count}{" "}
                    {activeSummary.count === 1 ? "ocena" : "ocen"} • Nauczyciel:{" "}
                    {activeSummary.grades[0]?.teacher ?? "—"}
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-zinc-500 border-b border-zinc-200">
                          <th className="py-2 pr-2 font-medium">Ocena</th>
                          <th className="py-2 pr-2 font-medium">Tytuł</th>
                          <th className="py-2 pr-2 font-medium">Waga</th>
                          <th className="py-2 pr-2 font-medium">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSummary.grades.map((g) => (
                          <tr
                            key={g.id}
                            className="border-b border-zinc-100 last:border-0"
                          >
                            <td className="py-2 pr-2">
                              <span
                                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-white font-bold ${gradeDotClass(
                                  g.value
                                )}`}
                              >
                                {g.value}
                              </span>
                            </td>
                            <td className="py-2 pr-2 text-zinc-800">
                              {g.title}
                              {g.comment && (
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  {g.comment}
                                </p>
                              )}
                            </td>
                            <td className="py-2 pr-2 text-zinc-600">
                              {g.weight}
                              {g.weight === 3
                                ? " (sprawdzian)"
                                : g.weight === 2
                                ? " (kartkówka)"
                                : " (aktywność)"}
                            </td>
                            <td className="py-2 pr-2 text-zinc-600">
                              {g.date.toLocaleDateString("pl-PL", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-zinc-500">
                  Wybierz przedmiot z listy, aby zobaczyć oceny.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

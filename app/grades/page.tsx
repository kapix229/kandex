"use client";

import { GradesSummary } from "@/components/GradesSummary";
import { Grade } from "@/src/types/shared";
import { useEffect, useState } from "react";

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGrades() {
      try {
        const res = await fetch("/api/v1/grades", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setGrades(data.data?.grades ?? []);
        }
      } catch (error) {
        console.error("Failed to load grades:", error);
      } finally {
        setLoading(false);
      }
    }
    loadGrades();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Oceny</h1>
      {loading ? (
        <p>Ładowanie ocen...</p>
      ) : (
        <GradesSummary grades={grades} />
      )}
    </div>
  );
}

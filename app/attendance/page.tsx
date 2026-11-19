"use client";

import { AttendanceChart } from "@/components/AttendanceChart";
import { AttendanceData } from "@/src/types/shared";
import { useEffect, useState } from "react";

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceData>({
    summary: { present: 0, absent: 0, late: 0, excused: 0, unknown: 0 },
    entries: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      try {
        const res = await fetch("/api/v1/attendance", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setAttendance({
            summary: data.data?.summary ?? attendance.summary,
            entries: data.data?.entries ?? [],
          });
        }
      } catch (error) {
        console.error("Failed to load attendance:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">Frekwencja</h1>
      {loading ? (
        <p>Ładowanie frekwencji...</p>
      ) : (
        <AttendanceChart data={attendance} />
      )}
    </div>
  );
}
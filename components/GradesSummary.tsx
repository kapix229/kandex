import { Grade } from "@/src/types/shared";

/**
 * Calculate weighted average from grades
 */
function calculateWeightedAverage(grades: Grade[]): number {
  if (!grades.length) return NaN;

  let sum = 0;
  let totalWeight = 0;

  for (const grade of grades) {
    const numericValue = grade.value;
    if (!Number.isFinite(numericValue)) continue;

    const weight = grade.weight ?? 1;
    sum += numericValue * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? sum / totalWeight : NaN;
}

export const GradesSummary = ({ grades }: { grades: Grade[] }) => {
  if (grades.length === 0) {
    return (
      <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
        Brak ocen
      </div>
    );
  }

  // Calculate weighted average
  const average = calculateWeightedAverage(grades);

  // Polish grading scale: 2 = dopuszczający, 3 = dostateczny, 4 = dobry, 5 = bardzo dobre, 6 = doskonały
  const color = !Number.isNaN(average)
    ? average >= 5.5
      ? "text-emerald-500"
      : average >= 4.5
        ? "text-green-500"
        : average >= 3.5
          ? "text-yellow-500"
          : average >= 2.5
            ? "text-orange-500"
            : "text-red-500"
    : "text-zinc-500";

  return (
    <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
      <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Średnia ocen</h2>
      <p className={`text-3xl font-bold ${color} mt-1`}>
        {Number.isNaN(average) ? "—" : average.toFixed(2)}
      </p>
      <p className="text-xs text-[var(--text-muted)]">({grades.length} ocen, ważone)</p>
    </div>
  );
};
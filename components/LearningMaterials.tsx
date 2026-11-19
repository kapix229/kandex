"use client";

import { LearningMaterial } from "@/services/learning-materials";

interface LearningMaterialsProps {
  materials: LearningMaterial[];
  keywords?: string[];
}

const sourceIcons: Record<string, string> = {
  youtube: "🎥",
  "khan-academy": "📚",
  wikipedia: "📖",
  coursera: "🎓",
  udemy: "💻",
  github: "🔧",
};

export default function LearningMaterials({
  materials,
  keywords,
}: LearningMaterialsProps) {
  if (materials.length === 0) {
    return (
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
        <p className="text-sm text-amber-800">
          Brak dostępnych materiałów dla tego tematu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {keywords && keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--accent-soft)] text-[#c7beff] border border-[var(--accent)]/30"
            >
              #{keyword}
            </span>
          ))}
        </div>
      )}

      {materials.map((material) => (
        <a
          key={material.id}
          href={material.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 rounded-xl border border-[var(--border)] bg-white/[0.025] hover:bg-white/[0.06] hover:border-[var(--accent)]/50 transition-all duration-200 group"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">
              {sourceIcons[material.source]}
            </span>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                {material.title}
              </p>

              <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">
                {material.description}
              </p>

              <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-muted)]">
                <span className="px-2 py-0.5 bg-[var(--surface-muted)] rounded">
                  {material.source === "youtube"
                    ? "YouTube"
                    : material.source === "khan-academy"
                      ? "Khan Academy"
                      : material.source.charAt(0).toUpperCase() +
                        material.source.slice(1)}
                </span>

                {material.difficulty && (
                  <span
                    className={`px-2 py-0.5 rounded ${
                      material.difficulty === "beginner"
                        ? "bg-[var(--success)]/15 text-[#8cf0b0]"
                        : material.difficulty === "intermediate"
                          ? "bg-[var(--warning)]/15 text-[#ffd08a]"
                          : "bg-[var(--danger)]/15 text-[#ffb0bf]"
                    }`}
                  >
                    {material.difficulty === "beginner"
                      ? "Początkujący"
                      : material.difficulty === "intermediate"
                        ? "Średniozaawansowany"
                        : "Zaawansowany"}
                  </span>
                )}

                {material.duration && (
                  <span className="ml-auto">⏱️ {material.duration}</span>
                )}

                {material.rating && (
                  <span className="ml-auto">⭐ {material.rating}</span>
                )}
              </div>
            </div>

            <span className="text-xl flex-shrink-0 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}

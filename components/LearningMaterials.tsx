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
              className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full"
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
          className="block p-4 rounded-lg border border-zinc-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">
              {sourceIcons[material.source]}
            </span>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                {material.title}
              </p>

              <p className="text-sm text-zinc-600 mt-1 line-clamp-2">
                {material.description}
              </p>

              <div className="flex items-center gap-2 mt-2 text-xs text-zinc-600">
                <span className="px-2 py-0.5 bg-zinc-100 rounded">
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
                        ? "bg-green-100 text-green-700"
                        : material.difficulty === "intermediate"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
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

"use client";

import { useEffect, useState } from "react";
import { LearningMaterial } from "@/services/learning-materials";
import { extractTopicsFromDescription, recommendMaterials } from "@/services/learning-materials";

interface Assignment {
  id: string;
  title: string;
  subject?: string;
  dueDate?: string;
  completed: boolean;
  description?: string;
}

interface AssignmentModalProps {
  assignment: Assignment;
  onClose: () => void;
  onUpdate: (updated: Assignment) => void;
}

export default function AssignmentModal({
  assignment,
  onClose,
  onUpdate,
}: AssignmentModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(assignment.title);
  const [editDescription, setEditDescription] = useState(assignment.description || "");
  const [isCompleting, setIsCompleting] = useState(false);
  const [aiMaterials, setAiMaterials] = useState<LearningMaterial[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Generate AI materials on mount
  useEffect(() => {
    const generateMaterials = async () => {
      setAiLoading(true);
      try {
        const topic = extractTopicsFromDescription(
          assignment.title,
          assignment.description,
          assignment.subject
        );
        const materials = recommendMaterials(topic);
        setAiMaterials(materials);
      } catch (err) {
        console.error("Failed to generate AI materials:", err);
      } finally {
        setAiLoading(false);
      }
    };
    generateMaterials();
  }, [assignment.title, assignment.description, assignment.subject]);

  const handleToggleComplete = async () => {
    setIsCompleting(true);
    const updated = { ...assignment, completed: !assignment.completed };
    onUpdate(updated);
    setIsCompleting(false);
  };

  const handleSaveEdit = () => {
    const updated = { ...assignment, title: editTitle, description: editDescription };
    onUpdate(updated);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(assignment.title);
    setEditDescription(assignment.description || "");
    setIsEditing(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Brak terminu";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="workspace-card rounded-2xl w-full max-w-2xl shadow-2xl border border-[var(--border)] animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h2 className="text-xl font-bold text-[var(--text)]">Szczegóły zadania</h2>
              <p className="text-xs text-[var(--text-tertiary)]">Kliknij, aby edytować</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--text-tertiary)] hover:bg-white/[0.06] hover:text-[var(--text)] transition-colors duration-200"
            aria-label="Zamknij"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title & Subject */}
          <div className="space-y-2">
            {isEditing ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 transition"
                placeholder="Tytuł zadania"
                autoFocus
              />
            ) : (
              <h3 className="text-lg font-bold text-[var(--text)]" onDoubleClick={() => setIsEditing(true)}>{assignment.title}</h3>
            )}

            {assignment.subject && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.25 15.25a3.5 3.5 0 1 1-4.96 0 3.5 3.5 0 1 1 4.96 0z" />
                  <path d="M15.57 17.43a6 6 0 0 0-8.94 0" />
                  <path d="M12.5 5a6 6 0 0 1 11.25 2.25" />
                </svg>
                {assignment.subject}
              </span>
            )}
          </div>

          {/* Due Date */}
          {assignment.dueDate && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-primary)] flex-shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Termin oddania</p>
                <p className="font-medium text-[var(--text)]">{formatDate(assignment.dueDate)}</p>
              </div>
              {new Date(assignment.dueDate) < new Date() && !assignment.completed && (
                <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--danger)]/15 text-[var(--danger)]">
                  Przeterminowane
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Opis</p>
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 transition resize-none h-32"
                placeholder="Dodaj opis zadania..."
              />
            ) : assignment.description ? (
              <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap" onDoubleClick={() => setIsEditing(true)}>
                {assignment.description}
              </p>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] italic" onDoubleClick={() => setIsEditing(true)}>
                Brak opisu. Kliknij dwukrotnie, aby dodać.
              </p>
            )}
          </div>

          {/* AI Learning Materials */}
          <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-[var(--accent-primary-muted)] to-[var(--info)]/10 border border-[var(--accent-primary)]/30">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <h4 className="font-semibold text-[var(--accent-primary)]">Materiały do nauki (AI)</h4>
            </div>

            {aiLoading ? (
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-primary)]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-secondary)]" style={{ animationDelay: "0.1s" }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-primary)]" style={{ animationDelay: "0.2s" }} />
                <span className="text-sm text-[var(--text-tertiary)] ml-2">Generuję sugestie...</span>
              </div>
            ) : aiMaterials.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                AI nie znalazło pasujących materiałów dla tego tematu.
              </p>
            ) : (
              <div className="space-y-2">
                {aiMaterials.slice(0, 4).map((material) => (
                  <a
                    key={material.id}
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-white/[0.025] hover:bg-white/[0.05] hover:border-[var(--accent-primary)]/50 transition-all duration-200 group"
                  >
                    <span className="text-xl flex-shrink-0">{getSourceIcon(material.source)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
                        {material.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-1">{material.description}</p>
                    </div>
                    <span className="text-xs text-[var(--accent-primary)] group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-t border-[var(--border)] bg-[var(--surface-muted)]/50">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] py-2.5 font-bold transition-all duration-200 hover:bg-white/[0.08]"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-inverse)] py-2.5 font-bold transition-all duration-200 hover:brightness-110 hover:shadow-[0_4px_16px_rgba(169,149,186,0.3)]"
              >
                Zapisz
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleToggleComplete}
                disabled={isCompleting}
                className={`flex-1 rounded-xl py-2.5 font-bold transition-all duration-200 ${
                  assignment.completed
                    ? "bg-[var(--warning)] text-[#1a1200] hover:brightness-110"
                    : "bg-[var(--success)] text-[#06281a] hover:brightness-110"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isCompleting ? "Aktualizuję..." : assignment.completed ? "↩️ Oznacz jako do zrobienia" : "✅ Oznacz jako gotowe"}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] py-2.5 font-bold transition-all duration-200 hover:bg-white/[0.08]"
              >
                ✏️ Edytuj
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    youtube: "🎥",
    "khan-academy": "📚",
    wikipedia: "📖",
    coursera: "🎓",
    udemy: "💻",
    github: "🔧",
  };
  return icons[source] || "🔗";
}
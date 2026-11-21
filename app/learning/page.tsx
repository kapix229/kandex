"use client";

import { useState, useEffect } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import SyncButton from "@/components/SyncButton";
import {
  BookOpen,
  Brain,
  Target,
  Trophy,
  Clock,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Settings,
  ArrowRight,
  Star,
  Flame,
  TrendingUp,
  Lightbulb,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

type Lesson = {
  id: string;
  subject: string;
  title: string;
  description: string;
  duration: number; // minutes
  content: LessonSection[];
  order: number;
};

type LessonSection = {
  id: string;
  type: "text" | "heading" | "formula" | "definition" | "example" | "recall" | "key-point";
  content: string;
  title?: string;
};

type StudyProgress = {
  lessonId: string;
  completedSections: string[];
  mastery: number; // 0-100
  lastStudied: string;
  timeSpent: number;
};

const mockLessons: Lesson[] = [
  {
    id: "math-functions",
    subject: "Matematyka",
    title: "Funkcje kwadratowe - przegląd",
    description: "Poznaj wykresy funkcji kwadratowych, miejsca zerowe i wierzchołki paraboli",
    duration: 25,
    order: 1,
    content: [
      {
        id: "intro",
        type: "heading",
        title: "Wstęp do funkcji kwadratowych",
        content: "Funkcja kwadratowa to funkcja postaci f(x) = ax² + bx + c, gdzie a ≠ 0. Jej wykresem jest parabola.",
      },
      {
        id: "formula",
        type: "formula",
        title: "Postać kanoniczna i ogólna",
        content: "f(x) = a(x - p)² + q (kanoniczna)\nf(x) = ax² + bx + c (ogólna)\nΔ = b² - 4ac (delta)\nx₁,₂ = (-b ± √Δ) / 2a (miejsca zerowe)\np = -b/2a, q = -Δ/4a (wierzchołek)",
      },
      {
        id: "definition",
        type: "definition",
        title: "Właściwości paraboli",
        content: "Jeśli a > 0, parabola ma ramiona skierowane w górę (ma minimum). Jeśli a < 0, ramiona w dół (ma maksimum). Wierzchołek W = (p, q) to punkt skrajny.",
      },
      {
        id: "example",
        type: "example",
        title: "Przykład: f(x) = 2x² - 8x + 6",
        content: "a = 2, b = -8, c = 6\nΔ = (-8)² - 4·2·6 = 64 - 48 = 16\nx₁ = (8 - 4) / 4 = 1\nx₂ = (8 + 4) / 4 = 3\np = 8/4 = 2, q = -16/8 = -2\nWierzchołek: W(2, -2)",
      },
      {
        id: "recall-1",
        type: "recall",
        title: "Sprawdź zrozumienie",
        content: "Dla funkcji f(x) = -x² + 4x - 3, jakie będą miejsca zerowe i czy parabola ma ramiona w górę czy w dół?",
      },
      {
        id: "key-point",
        type: "key-point",
        title: "Kluczowe do zapamiętania",
        content: "• Delta decyduje o liczbie miejsc zerowych (Δ > 0: dwa, Δ = 0: jeden, Δ < 0: brak)\n• Wierzchołek zawsze leży na osi symetrii paraboli x = p\n• Wartość q to wartość skrajna funkcji (min lub max)",
      },
    ],
  },
  {
    id: "physics-motion",
    subject: "Fizyka",
    title: "Ruch jednostajny i równomiernie przyspieszony",
    description: "Zrozum wzory na drogę, prędkość i przyspieszenie w różnych rodzajach ruchu",
    duration: 30,
    order: 2,
    content: [
      {
        id: "intro",
        type: "heading",
        title: "Rodzaje ruchu",
        content: "Ruch jednostajny: prędkość stała, przyspieszenie = 0. Ruch równomiernie przyspieszony: prędkość zmienia się proporcjonalnie do czasu.",
      },
      {
        id: "formula-ru",
        type: "formula",
        title: "Wzory na ruch jednostajny",
        content: "v = const\ns = v · t",
      },
      {
        id: "formula-rpr",
        type: "formula",
        title: "Wzory na ruch równomiernie przyspieszony",
        content: "v = v₀ + a·t\ns = v₀·t + ½·a·t²\nv² = v₀² + 2·a·s",
      },
      {
        id: "definition",
        type: "definition",
        title: "Jednostki SI",
        content: "Droga (s): metr [m]\nPrędkość (v): metr na sekundę [m/s]\nPrzyspieszenie (a): metr na sekundę kwadratową [m/s²]\nCzas (t): sekunda [s]",
      },
      {
        id: "example",
        type: "example",
        title: "Przykład: Samochód przyspiesza z 0 do 100 km/h w 8 s",
        content: "v₀ = 0, v = 100 km/h ≈ 27.78 m/s, t = 8 s\na = v/t = 27.78/8 ≈ 3.47 m/s²\ns = ½·a·t² = 0.5·3.47·64 ≈ 111 m",
      },
      {
        id: "recall-1",
        type: "recall",
        title: "Sprawdź zrozumienie",
        content: "Ciało porusza się ruchem jednostajnym z prędkością 20 m/s. Jaką drogę pokona w 15 sekund?",
      },
      {
        id: "key-point",
        type: "key-point",
        title: "Kluczowe do zapamiętania",
        content: "• W ruchu jednostajnym droga rośnie liniowo z czasem\n• W ruchu równo przyspieszonym droga rośnie kwadratowo z czasem\n• Zawsze sprawdzaj jednostki przed obliczeniami",
      },
    ],
  },
  {
    id: "chemistry-bonds",
    subject: "Chemia",
    title: "Wiązania chemiczne - przegląd",
    description: "Wiązania jonowe, kowalencyjne i metaliczne - różnice i przykłady",
    duration: 20,
    order: 3,
    content: [
      {
        id: "intro",
        type: "heading",
        title: "Rodzaje wiązań chemicznych",
        content: "Atomy łączą się, by osiągnąć stabilną konfigurację elektroniczną (oktet). Główne typy to wiązania jonowe, kowalencyjne i metaliczne.",
      },
      {
        id: "definition-1",
        type: "definition",
        title: "Wiązanie jonowe",
        content: "Powstaje między metale a niemetalami. Elektrony są przenoszone, tworząc jony o ładunkach przeciwnych. Przykład: NaCl (sód + chlor).",
      },
      {
        id: "definition-2",
        type: "definition",
        title: "Wiązanie kowalencyjne",
        content: "Powstaje między niemetalami. Elektrony są wspólne (parowane). Może być polaryzowane (np. H₂O) lub niepolaryzowane (np. O₂, N₂).",
      },
      {
        id: "definition-3",
        type: "definition",
        title: "Wiązanie metaliczne",
        content: "W metalach. Elektrony walencyjne tworzą 'gaz elektronowy' swobodnie poruszający się wokół jonów dodatnich. Odpowiada za przewodność.",
      },
      {
        id: "example",
        type: "example",
        title: "Przykłady z życia codziennego",
        content: "Kuchenne soli (NaCl) - wiązanie jonowe\nWoda (H₂O) - wiązanie kowalencyjne polaryzowane\nDruty miedziane - wiązanie metaliczne (przewodnictwo prądu)",
      },
      {
        id: "recall-1",
        type: "recall",
        title: "Sprawdź zrozumienie",
        content: "Dlaczego metale dobrze prowadzą prąd i ciepło? Jakie wiązanie za to odpowiada?",
      },
      {
        id: "key-point",
        type: "key-point",
        title: "Kluczowe do zapamiętania",
        content: "• Różnica elekronegatywności decyduje o typie wiązania\n• > 1.7: jonowe, 0.4-1.7: kowalencyjne polaryzowane, < 0.4: kowalencyjne niepolaryzowane\n• Wiązanie metaliczne = 'morze elektronów'",
      },
    ],
  },
];

export default function LearningPage() {
  const { account, signOut } = useVulcanSession();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(mockLessons[0]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [progress, setProgress] = useState<Record<string, StudyProgress>>(() => {
    // Initialize from localStorage synchronously
    const saved = localStorage.getItem("kandex-study-progress");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse study progress", e);
      }
    }
    return {};
  });
  const [showTOC, setShowTOC] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Save progress
  useEffect(() => {
    localStorage.setItem("kandex-study-progress", JSON.stringify(progress));
  }, [progress]);

  const lessonProgress = selectedLesson ? progress[selectedLesson.id] : null;
  const completedSections = lessonProgress?.completedSections || [];
  const mastery = lessonProgress?.mastery || 0;

  const markSectionComplete = (sectionId: string) => {
    if (!selectedLesson) return;
    const current = progress[selectedLesson.id] || { completedSections: [], mastery: 0, lastStudied: new Date().toISOString(), timeSpent: 0 };
    if (!current.completedSections.includes(sectionId)) {
      const newCompleted = [...current.completedSections, sectionId];
      const newMastery = Math.round((newCompleted.length / selectedLesson.content.length) * 100);
      setProgress({
        ...progress,
        [selectedLesson.id]: {
          ...current,
          completedSections: newCompleted,
          mastery: newMastery,
          lastStudied: new Date().toISOString(),
        },
      });
    }
  };

  const goToNextSection = () => {
    if (selectedLesson && currentSectionIndex < selectedLesson.content.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else if (selectedLesson) {
      // Move to next lesson
      const currentIndex = mockLessons.findIndex(l => l.id === selectedLesson.id);
      if (currentIndex < mockLessons.length - 1) {
        setSelectedLesson(mockLessons[currentIndex + 1]);
        setCurrentSectionIndex(0);
      }
    }
  };

  const goToPrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    } else if (selectedLesson) {
      const currentIndex = mockLessons.findIndex(l => l.id === selectedLesson.id);
      if (currentIndex > 0) {
        setSelectedLesson(mockLessons[currentIndex - 1]);
        setCurrentSectionIndex(mockLessons[currentIndex - 1].content.length - 1);
      }
    }
  };

  const currentSection = selectedLesson?.content[currentSectionIndex];

  const getSectionIcon = (type: string) => {
    switch (type) {
      case "heading": return <BookOpen className="h-5 w-5" strokeWidth={2} />;
      case "formula": return <Lightbulb className="h-5 w-5" strokeWidth={2} />;
      case "definition": return <Target className="h-5 w-5" strokeWidth={2} />;
      case "example": return <Star className="h-5 w-5" strokeWidth={2} />;
      case "recall": return <Brain className="h-5 w-5" strokeWidth={2} />;
      case "key-point": return <Trophy className="h-5 w-5" strokeWidth={2} />;
      default: return <BookOpen className="h-5 w-5" strokeWidth={2} />;
    }
  };

  const getSectionColor = (type: string) => {
    switch (type) {
      case "heading": return "text-[var(--accent)] bg-[var(--accent-primary-muted)]";
      case "formula": return "text-[var(--warning)] bg-[var(--warning-muted)]";
      case "definition": return "text-[var(--info)] bg-[var(--info-muted)]";
      case "example": return "text-[var(--success)] bg-[var(--success-muted)]";
      case "recall": return "text-[var(--danger)] bg-[var(--danger-muted)]";
      case "key-point": return "text-[var(--accent-secondary)] bg-[var(--success-muted)]";
      default: return "text-[var(--text-tertiary)] bg-[var(--surface-hover)]";
    }
  };

  const isSectionComplete = (sectionId: string) => completedSections.includes(sectionId);

  async function handleLogout() {
    try {
      await fetch("/api/eduvulcan/login", { method: "DELETE" });
    } catch (err) {
      console.error("logout failed:", err);
    } finally {
      signOut();
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Top Bar for Learning */}
      <header className="fixed top-0 left-0 right-0 z-40 h-[48px] border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl">
        <div className="h-full flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              onClick={() => setShowTOC(true)}
              className="lg:hidden btn-ghost p-2"
              aria-label="Spis treści"
            >
              <Menu className="h-5 w-5" strokeWidth={2} />
            </button>
            <Link href="/" className="flex items-center gap-2 text-sm font-extrabold text-[var(--text)]">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[var(--text-inverse)]">K</span>
              <span className="hidden sm:inline">Kandex</span>
            </Link>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Nauka</span>
              <span className="text-sm font-semibold text-[var(--text)]">{selectedLesson?.subject}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--accent-primary-muted)] text-[var(--accent)] text-sm font-medium">
              <Flame className="h-4 w-4" strokeWidth={2} />
              <span className="tabular-nums font-mono">{mastery}%</span>
            </div>
            {account && (
              <button onClick={handleLogout} className="btn-secondary text-sm">Wyloguj</button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile TOC Drawer */}
      {showTOC && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowTOC(false)} />
          <aside className="w-[300px] max-w-full bg-[var(--surface)] border-r border-[var(--border)] animate-slide-in-right">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-bold text-[var(--text)]">Spis treści</h2>
              <button onClick={() => setShowTOC(false)} className="btn-ghost p-2">
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
              {mockLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedLesson(lesson);
                    setCurrentSectionIndex(0);
                    setShowTOC(false);
                  }}
                  className={`block p-3 rounded-xl transition-all ${
                    lesson.id === selectedLesson?.id
                      ? "bg-[var(--accent-primary-muted)] border border-[var(--accent-primary-border)]"
                      : "hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  <p className="font-medium text-[var(--text)]">{lesson.title}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{lesson.subject} · {lesson.duration} min</p>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="pt-[48px] min-h-screen">
        <div className="flex lg:flex-row">
          {/* Sidebar - Lesson List */}
          <aside className="hidden lg:block w-[280px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-xl sticky top-[48px] h-[calc(100vh-48px)] overflow-y-auto">
            <nav className="p-4 space-y-2">
              {mockLessons.map((lesson) => {
                const lp = progress[lesson.id];
                const lessonMastery = lp?.mastery || 0;
                const isActive = lesson.id === selectedLesson?.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setCurrentSectionIndex(0);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                      isActive
                        ? "bg-[var(--accent-primary-muted)] border border-[var(--accent-primary-border)]"
                        : "hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className={`flex-shrink-0 grid h-10 w-10 place-items-center rounded-lg ${
                      isActive ? "bg-[var(--accent)] text-[var(--text-inverse)]" : "bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
                    }`}>
                      <BookOpen className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isActive ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-[var(--text-tertiary)]">{lesson.duration} min</span>
                        <div className="w-16 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                            style={{ width: `${lessonMastery}%` }}
                          />
                        </div>
                        <span className="tabular-nums font-mono text-[var(--text-tertiary)]">{lessonMastery}%</span>
                      </div>
                    </div>
                    {isActive && <ChevronRight className="h-5 w-5 text-[var(--accent)] flex-shrink-0" strokeWidth={2} />}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 p-4 lg:p-8">
            <div className="mx-auto max-w-3xl space-y-6">
              {selectedLesson && (
                <>
                  {/* Lesson Header */}
                  <div className="animate-slide-up">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[var(--accent-primary-muted)] text-[var(--accent)]">
                        {selectedLesson.subject}
                      </span>
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[var(--surface-hover)] text-[var(--text-tertiary)]">
                        Lekcja {selectedLesson.order} z {mockLessons.length}
                      </span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[var(--text)] mb-2">
                      {selectedLesson.title}
                    </h1>
                    <p className="text-[var(--text-secondary)] mb-4">{selectedLesson.description}</p>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" strokeWidth={2} />
                        {selectedLesson.duration} min czytania
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" strokeWidth={2} />
                        {mastery}% opanowane
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="animate-slide-up" style={{ animationDelay: "60ms" }}>
                    <div className="h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] transition-all duration-500"
                        style={{ width: `${mastery}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                      <span>Sekcja {currentSectionIndex + 1} z {selectedLesson.content.length}</span>
                      <span className="tabular-nums font-mono">{mastery}% ukończone</span>
                    </div>
                  </div>

                  {/* Current Section Content */}
                  {currentSection && (
                    <article className="animate-slide-up prose max-w-none" style={{ animationDelay: "100ms" }}>
                      <div className={`card p-6 lg:p-8 relative overflow-hidden ${isSectionComplete(currentSection.id) ? "ring-1 ring-[var(--success)]" : ""}`}>
                        {/* Section type badge */}
                        <div className="mb-4 flex items-center gap-3">
                          <div className={`flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl ${getSectionColor(currentSection.type)}`}>
                            {getSectionIcon(currentSection.type)}
                          </div>
                          <div>
                            <p className={`font-semibold ${getSectionColor(currentSection.type).replace("bg-[var", "text-[var").replace("--muted)]", "")}`}>
                              {currentSection.type.charAt(0).toUpperCase() + currentSection.type.slice(1)}
                              {currentSection.title && `: ${currentSection.title}`}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">
                              Sekcja {currentSectionIndex + 1} z {selectedLesson.content.length}
                            </p>
                          </div>
                          {isSectionComplete(currentSection.id) && (
                            <span className="ml-auto px-2 py-1 rounded-full text-[10px] font-bold bg-[var(--success)]/20 text-[var(--success)]">
                              ✓ Ukończone
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className={`${currentSection.type === "formula" ? "font-mono whitespace-pre bg-[var(--bg-secondary)] p-4 rounded-xl" : ""}`}>
                          {currentSection.type === "heading" && (
                            <h2 className="text-xl font-bold text-[var(--text)] mb-3">{currentSection.content}</h2>
                          )}
                          {currentSection.type === "formula" && (
                            <div className="text-base leading-relaxed text-[var(--text)]">{currentSection.content}</div>
                          )}
                          {currentSection.type === "definition" && (
                            <div className="bg-[var(--info-muted)]/50 border-l-4 border-[var(--info)] p-4 rounded-r-xl">
                              <p className="text-[var(--text)] leading-relaxed">{currentSection.content}</p>
                            </div>
                          )}
                          {currentSection.type === "example" && (
                            <div className="bg-[var(--success-muted)]/50 border-l-4 border-[var(--success)] p-4 rounded-r-xl">
                              <p className="text-[var(--text)] leading-relaxed">{currentSection.content}</p>
                            </div>
                          )}
                          {currentSection.type === "recall" && (
                            <div className="bg-[var(--danger-muted)]/50 border-l-4 border-[var(--danger)] p-4 rounded-r-xl">
                              <p className="font-semibold text-[var(--text)] mb-2">Pytanie do zapamiętania:</p>
                              <p className="text-[var(--text)] leading-relaxed">{currentSection.content}</p>
                              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                <button
                                  onClick={() => markSectionComplete(currentSection.id)}
                                  className="btn-primary w-full sm:w-auto"
                                >
                                  Zrozumiałem, oznacz jako ukończone
                                </button>
                              </div>
                            </div>
                          )}
                          {currentSection.type === "key-point" && (
                            <div className="bg-[var(--accent-primary-muted)]/50 border-l-4 border-[var(--accent)] p-4 rounded-r-xl">
                              <p className="font-semibold text-[var(--text)] mb-2">Kluczowe do zapamiętania:</p>
                              <div className="text-[var(--text)] leading-relaxed whitespace-pre-line">{currentSection.content}</div>
                            </div>
                          )}
                          {currentSection.type === "text" && (
                            <p className="text-[var(--text)] leading-relaxed">{currentSection.content}</p>
                          )}

                        </div>

                        {/* Section Navigation */}
                        <div className="mt-6 pt-6 border-t border-[var(--border)] flex items-center justify-between">
                          <button
                            onClick={goToPrevSection}
                            disabled={!selectedLesson || (currentSectionIndex === 0 && mockLessons.indexOf(selectedLesson) === 0)}
                            className="btn-secondary gap-1"
                          >
                            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                            Poprzednia
                          </button>

                          <div className="flex items-center gap-2">
                            {selectedLesson.content.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentSectionIndex(i)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  i === currentSectionIndex
                                    ? "bg-[var(--accent)] w-6"
                                    : isSectionComplete(selectedLesson.content[i].id)
                                    ? "bg-[var(--success)]"
                                    : "bg-[var(--border)] hover:bg-[var(--border-strong)]"
                                }`}
                                aria-label={`Sekcja ${i + 1}`}
                              />
                            ))}
                          </div>

                          <button
                            onClick={goToNextSection}
                            disabled={!selectedLesson || (currentSectionIndex === selectedLesson.content.length - 1 && mockLessons.indexOf(selectedLesson) === mockLessons.length - 1)}
                            className="btn-primary gap-1"
                          >
                            Następna
                            <ChevronRight className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </article>
                  )}

                  {/* Quick Actions */}
                  <div className="card p-5 animate-slide-up" style={{ animationDelay: "160ms" }}>
                    <h3 className="font-semibold text-[var(--text)] mb-4">Narzędzia nauki</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Link href="/ai-tutor" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all group">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--warning-muted)] text-[var(--warning)] group-hover:scale-105 transition-transform">
                          <Brain className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <span className="text-sm font-medium text-[var(--text)]">AI Tutor</span>
                      </Link>
                      <Link href="/flashcards" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all group">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--success-muted)] text-[var(--success)] group-hover:scale-105 transition-transform">
                          <Target className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <span className="text-sm font-medium text-[var(--text)]">Fiszki</span>
                      </Link>
                      <Link href="/progress" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all group">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--info-muted)] text-[var(--info)] group-hover:scale-105 transition-transform">
                          <TrendingUp className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <span className="text-sm font-medium text-[var(--text)]">Postęp</span>
                      </Link>
                      <button className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all group">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-primary-muted)] text-[var(--accent)] group-hover:scale-105 transition-transform">
                          <Settings className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <span className="text-sm font-medium text-[var(--text)]">Ustawienia</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
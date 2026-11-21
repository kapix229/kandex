"use client";

import { useState } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import Link from "next/link";
import {
  Target,
  RotateCcw,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Brain,
  Zap,
  Star,
  Download,
  Filter,
  Shuffle,
  X,
} from "lucide-react";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  createdAt: string;
  reviewCount: number;
  lastReviewed?: string;
  nextReview?: string;
};

type FlashcardSet = {
  id: string;
  name: string;
  subject: string;
  cards: Flashcard[];
  createdAt: string;
};

const mockFlashcardSets: FlashcardSet[] = [
  {
    id: "math-functions",
    name: "Funkcje kwadratowe",
    subject: "Matematyka",
    createdAt: "2024-10-15",
    cards: [
      { id: "1", front: "Postać ogólna funkcji kwadratowej", back: "f(x) = ax² + bx + c, gdzie a ≠ 0", subject: "Matematyka", topic: "Funkcje", difficulty: "easy", createdAt: "2024-10-15", reviewCount: 3, lastReviewed: "2024-11-10", nextReview: "2024-11-17" },
      { id: "2", front: "Delta (Δ) - wzór", back: "Δ = b² - 4ac", subject: "Matematyka", topic: "Funkcje", difficulty: "easy", createdAt: "2024-10-15", reviewCount: 5, lastReviewed: "2024-11-12", nextReview: "2024-11-19" },
      { id: "3", front: "Miejsca zerowe - wzór", back: "x₁,₂ = (-b ± √Δ) / 2a", subject: "Matematyka", topic: "Funkcje", difficulty: "medium", createdAt: "2024-10-15", reviewCount: 2, lastReviewed: "2024-11-08", nextReview: "2024-11-15" },
      { id: "4", front: "Wierzchołek paraboli - współrzędne", back: "p = -b/2a, q = -Δ/4a → W(p, q)", subject: "Matematyka", topic: "Funkcje", difficulty: "medium", createdAt: "2024-10-15", reviewCount: 4, lastReviewed: "2024-11-11", nextReview: "2024-11-18" },
      { id: "5", front: "Kiedy parabola ma ramiona w górę?", back: "Gdy a > 0 (ma minimum)", subject: "Matematyka", topic: "Funkcje", difficulty: "easy", createdAt: "2024-10-15", reviewCount: 6, lastReviewed: "2024-11-13", nextReview: "2024-11-20" },
    ],
  },
  {
    id: "physics-motion",
    name: "Ruchy - wzory",
    subject: "Fizyka",
    createdAt: "2024-10-20",
    cards: [
      { id: "6", front: "Ruch jednostajny - wzór na drogę", back: "s = v · t", subject: "Fizyka", topic: "Kinematyka", difficulty: "easy", createdAt: "2024-10-20", reviewCount: 4, lastReviewed: "2024-11-12", nextReview: "2024-11-19" },
      { id: "7", front: "Ruch równo przyspieszony - prędkość", back: "v = v₀ + a·t", subject: "Fizyka", topic: "Kinematyka", difficulty: "easy", createdAt: "2024-10-20", reviewCount: 3, lastReviewed: "2024-11-10", nextReview: "2024-11-17" },
      { id: "8", front: "Ruch równo przyspieszony - droga", back: "s = v₀·t + ½·a·t²", subject: "Fizyka", topic: "Kinematyka", difficulty: "medium", createdAt: "2024-10-20", reviewCount: 2, lastReviewed: "2024-11-09", nextReview: "2024-11-16" },
      { id: "9", front: "Wzór na prędkość bez czasu", back: "v² = v₀² + 2·a·s", subject: "Fizyka", topic: "Kinematyka", difficulty: "hard", createdAt: "2024-10-20", reviewCount: 1, lastReviewed: "2024-11-05", nextReview: "2024-11-12" },
    ],
  },
  {
    id: "chemistry-bonds",
    name: "Wiązania chemiczne",
    subject: "Chemia",
    createdAt: "2024-10-25",
    cards: [
      { id: "10", front: "Wiązanie jonowe - definicja", back: "Przenoszenie elektrónów między metalem a niemetalem, tworzenie jonów o ładunkach przeciwnych (np. NaCl)", subject: "Chemia", topic: "Wiązania", difficulty: "easy", createdAt: "2024-10-25", reviewCount: 5, lastReviewed: "2024-11-13", nextReview: "2024-11-20" },
      { id: "11", front: "Wiązanie kowalencyjne - definicja", back: "Współdzielenie par elektrónowych między niemetalami (np. H₂O, O₂)", subject: "Chemia", topic: "Wiązania", difficulty: "easy", createdAt: "2024-10-25", reviewCount: 4, lastReviewed: "2024-11-11", nextReview: "2024-11-18" },
      { id: "12", front: "Różnica elekronegatywności a typ wiązania", back: "> 1.7: jonowe, 0.4-1.7: kowalencyjne polaryzowane, < 0.4: kowalencyjne niepolaryzowane", subject: "Chemia", topic: "Wiązania", difficulty: "medium", createdAt: "2024-10-25", reviewCount: 3, lastReviewed: "2024-11-10", nextReview: "2024-11-17" },
    ],
  },
];

export default function FlashcardsPage() {
  const { account, signOut } = useVulcanSession();
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(mockFlashcardSets[0]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCard, setNewCard] = useState({ front: "", back: "", subject: "", topic: "", difficulty: "medium" as "easy" | "medium" | "hard" });
  const [filterSubject, setFilterSubject] = useState<string>("all");

  // Compute stats synchronously since mockFlashcardSets is static
  const stats = (() => {
    let total = 0, due = 0, mastered = 0, learning = 0;
    const now = new Date();
    mockFlashcardSets.forEach(set => {
      set.cards.forEach(card => {
        total++;
        if (card.nextReview && new Date(card.nextReview) <= now) due++;
        if (card.reviewCount >= 5) mastered++;
        else learning++;
      });
    });
    return { total, due, mastered, learning };
  })();

  const allCards = mockFlashcardSets.flatMap(set => set.cards.map(card => ({ ...card, setName: set.name })));
  const filteredCards = filterSubject === "all" ? allCards : allCards.filter(c => c.subject === filterSubject);
  const subjects = Array.from(new Set(allCards.map(c => c.subject)));

  const currentCard = selectedSet?.cards[currentCardIndex];

  const flipCard = () => setIsFlipped(!isFlipped);
  const nextCard = () => {
    if (selectedSet && currentCardIndex < selectedSet.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };
  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const startReview = () => {
    const dueCards = allCards.filter(card => card.nextReview && new Date(card.nextReview) <= new Date());
    if (dueCards.length === 0) {
      setReviewQueue(selectedSet?.cards || []);
    } else {
      setReviewQueue(dueCards);
    }
    setReviewIndex(0);
    setReviewMode(true);
    setShowAnswer(false);
  };

  const handleReviewAnswer = (correct: boolean) => {
    if (reviewIndex < reviewQueue.length - 1) {
      setReviewIndex(reviewIndex + 1);
      setShowAnswer(false);
    } else {
      setReviewMode(false);
      alert("Sesja powtórkowa zakończona! 🎉");
    }
  };

  async function handleLogout() {
    try {
      await fetch("/api/eduvulcan/login", { method: "DELETE" });
    } catch (err) {
      console.error("logout failed:", err);
    } finally {
      signOut();
    }
  }

  const renderReviewMode = () => (
    <div className="card p-6 lg:p-8 animate-slide-up">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--text)]">Sesja powtórkowa</h2>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--surface-hover)] border border-[var(--border)]">
            {reviewIndex + 1} / {reviewQueue.length}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${((reviewIndex + 1) / reviewQueue.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="perspective-1000">
        <div
          className={`relative w-full max-w-2xl mx-auto h-[300px] cursor-pointer transition-transform duration-500 transform-style-3d ${showAnswer ? "rotate-y-180" : ""}`}
          onClick={() => setShowAnswer(true)}
        >
          <div className="absolute w-full h-full backface-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-8 flex items-center justify-center">
            <p className="text-xl font-semibold text-[var(--text)] text-center leading-relaxed">
              {reviewQueue[reviewIndex]?.front}
            </p>
          </div>
          <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl bg-[var(--success-muted)] border border-[var(--success-border)] p-8 flex flex-col items-center justify-center">
            <p className="text-xl font-semibold text-[var(--text)] text-center leading-relaxed mb-4">
              {reviewQueue[reviewIndex]?.back}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleReviewAnswer(false)}
                className="btn-danger px-6"
              >
                <XCircle className="h-4 w-4" strokeWidth={2} />
                Nie wiem
              </button>
              <button
                onClick={() => handleReviewAnswer(true)}
                className="btn-success px-6"
              >
                <CheckCircle className="h-4 w-4" strokeWidth={2} />
                Wiem
              </button>
            </div>
          </div>
        </div>
      </div>

      {!showAnswer && (
        <p className="mt-6 text-center text-sm text-[var(--text-tertiary)]">
          Kliknij kartę, by odkryć odpowiedź
        </p>
      )}
    </div>
  );

  const renderBrowseMode = () => (
    <div className="card overflow-hidden animate-slide-up">
      <div className="perspective-1000">
        <div
          className={`relative w-full max-w-2xl mx-auto h-[300px] cursor-pointer transition-transform duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}
          onClick={flipCard}
        >
          <div className="absolute w-full h-full backface-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[var(--accent-primary-muted)] text-[var(--accent)]">
                  {currentCard?.topic}
                </span>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                  currentCard?.difficulty === "easy" ? "bg-[var(--success-muted)] text-[var(--success)]" :
                  currentCard?.difficulty === "medium" ? "bg-[var(--warning-muted)] text-[var(--warning)]" :
                  "bg-[var(--danger-muted)] text-[var(--danger)]"
                }`}>
                  {currentCard?.difficulty === "easy" ? "Łatwe" : currentCard?.difficulty === "medium" ? "Średnie" : "Trudne"}
                </span>
              </div>
              <p className="text-2xl font-semibold text-[var(--text)] leading-relaxed">
                {currentCard?.front}
              </p>
            </div>
          </div>
          <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl bg-[var(--success-muted)] border border-[var(--success-border)] p-8 flex flex-col items-center justify-center">
            <div className="text-center mb-4">
              <p className="text-2xl font-semibold text-[var(--text)] leading-relaxed">
                {currentCard?.back}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1">
                <RotateCcw className="h-4 w-4" strokeWidth={2} />
                Powtórzone {currentCard?.reviewCount}x
              </span>
              {currentCard?.nextReview && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4" strokeWidth={2} />
                  Następna: {new Date(currentCard.nextReview).toLocaleDateString("pl-PL")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-[var(--text-tertiary)]">
        Kliknij kartę, by ją odwrócić {isFlipped ? "(odpowiedź)" : "(pytanie)"}
      </p>

      <div className="mt-6 pt-6 border-t border-[var(--border)] flex items-center justify-between">
        <button
          onClick={prevCard}
          disabled={currentCardIndex === 0}
          className="btn-secondary gap-1"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          Poprzednia
        </button>

        <div className="flex items-center gap-2">
          {selectedSet?.cards.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentCardIndex(i);
                setIsFlipped(false);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentCardIndex
                  ? "bg-[var(--accent)] w-6"
                  : "bg-[var(--border)] hover:bg-[var(--border-strong)]"
              }`}
              aria-label={`Karta ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextCard}
          disabled={currentCardIndex === (selectedSet?.cards.length || 1) - 1}
          className="btn-primary gap-1"
        >
          Następna
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-[var(--border)] flex flex-wrap gap-3">
        <button onClick={startReview} className="btn-primary gap-2">
          <Zap className="h-4 w-4" strokeWidth={2} />
          Rozpocznij powtórkę ({stats.due} kart)
        </button>
        <button className="btn-secondary gap-2">
          <Shuffle className="h-4 w-4" strokeWidth={2} />
          Przetasuj
        </button>
        <button className="btn-secondary gap-2">
          <Download className="h-4 w-4" strokeWidth={2} />
          Eksportuj
        </button>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="card p-12 text-center animate-fade-in">
      <Target className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" strokeWidth={1.5} />
      <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Brak zestawów fiszek</h3>
      <p className="text-sm text-[var(--text-tertiary)] mb-6">
        Utwórz swój pierwszy zestaw fiszek, aby rozpocząć naukę.
      </p>
      <button className="btn-primary gap-2" onClick={() => setShowCreateModal(true)}>
        <Plus className="h-4 w-4" strokeWidth={2} />
        Utwórz zestaw
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="fixed top-0 left-0 right-0 z-40 h-[48px] border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl">
        <div className="h-full flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Link href="/" className="flex items-center gap-2 text-sm font-extrabold text-[var(--text)]">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[var(--text-inverse)]">K</span>
              <span className="hidden sm:inline">Kandex</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--success-muted)] text-[var(--success)] border border-[var(--success-border)]">
              <Target className="h-4 w-4" strokeWidth={2} />
              <span className="text-sm font-semibold">Fiszki</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {account && (
              <button onClick={handleLogout} className="btn-secondary text-sm">Wyloguj</button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-[48px] min-h-screen">
        <div className="flex lg:flex-row">
          <aside className="hidden lg:block w-[300px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-xl sticky top-[48px] h-[calc(100vh-48px)] overflow-y-auto">
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[var(--text)]">Zestawy fiszek</h2>
                <button className="btn-primary text-sm gap-1" onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  Nowy
                </button>
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" strokeWidth={2} />
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="input pl-10 pr-4 w-full"
                >
                  <option value="all">Wszystkie przedmioty</option>
                  {subjects.map(subj => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>
            </div>

            <nav className="p-4 space-y-2">
              {mockFlashcardSets
                .filter(set => filterSubject === "all" || set.subject === filterSubject)
                .map((set) => {
                  const dueCount = set.cards.filter(c => c.nextReview && new Date(c.nextReview) <= new Date()).length;
                  const isActive = set.id === selectedSet?.id;
                  return (
                    <button
                      key={set.id}
                      onClick={() => {
                        setSelectedSet(set);
                        setCurrentCardIndex(0);
                        setIsFlipped(false);
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
                        <Target className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isActive ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                          {set.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-hover)] text-[var(--text-tertiary)]">
                            {set.subject}
                          </span>
                          <span className="text-[var(--text-tertiary)]">{set.cards.length} kart</span>
                          {dueCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--warning-muted)] text-[var(--warning)]">
                              {dueCount} do powtórki
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </nav>
          </aside>

          <div className="flex-1 min-w-0 p-4 lg:p-8">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up stagger-children">
                <div className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Wszystkie karty</p>
                      <p className="mt-1 text-2xl font-extrabold text-[var(--text)] tabular-nums font-mono">{stats.total}</p>
                    </div>
                    <Target className="h-8 w-8 text-[var(--accent)]" strokeWidth={2} />
                  </div>
                </div>
                <div className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Do powtórki</p>
                      <p className="mt-1 text-2xl font-extrabold text-[var(--warning)] tabular-nums font-mono">{stats.due}</p>
                    </div>
                    <RotateCcw className="h-8 w-8 text-[var(--warning)]" strokeWidth={2} />
                  </div>
                </div>
                <div className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Opanowane</p>
                      <p className="mt-1 text-2xl font-extrabold text-[var(--success)] tabular-nums font-mono">{stats.mastered}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-[var(--success)]" strokeWidth={2} />
                  </div>
                </div>
                <div className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">W nauce</p>
                      <p className="mt-1 text-2xl font-extrabold text-[var(--info)] tabular-nums font-mono">{stats.learning}</p>
                    </div>
                    <Brain className="h-8 w-8 text-[var(--info)]" strokeWidth={2} />
                  </div>
                </div>
              </div>

              {reviewMode ? (
                renderReviewMode()
              ) : selectedSet ? (
                renderBrowseMode()
              ) : (
                renderEmptyState()
              )}

              <div className="card p-5 animate-slide-up" style={{ animationDelay: "160ms" }}>
                <h3 className="font-semibold text-[var(--text)] mb-4">Narzędzia</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Link href="/ai-tutor" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all group">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--warning-muted)] text-[var(--warning)] group-hover:scale-105 transition-transform">
                      <Brain className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium text-[var(--text)]">AI Tutor</span>
                  </Link>
                  <Link href="/learning" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all group">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-primary-muted)] text-[var(--accent)] group-hover:scale-105 transition-transform">
                      <Target className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium text-[var(--text)]">Lekcje</span>
                  </Link>
                  <Link href="/progress" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all group">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--info-muted)] text-[var(--info)] group-hover:scale-105 transition-transform">
                      <RotateCcw className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium text-[var(--text)]">Postęp</span>
                  </Link>
                  <Link href="/achievements" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all group">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--success-muted)] text-[var(--success)] group-hover:scale-105 transition-transform">
                      <Star className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium text-[var(--text)]">Osiągnięcia</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text)]">Nowa fiszka</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-ghost p-2">
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Przód (pytanie)</label>
                <textarea
                  value={newCard.front}
                  onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Np. Postać kanoniczna funkcji kwadratowej"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Tył (odpowiedź)</label>
                <textarea
                  value={newCard.back}
                  onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Np. f(x) = a(x - p)² + q"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">Przedmiot</label>
                  <select
                    value={newCard.subject}
                    onChange={(e) => setNewCard({ ...newCard, subject: e.target.value })}
                    className="input"
                  >
                    <option value="">Wybierz...</option>
                    <option value="Matematyka">Matematyka</option>
                    <option value="Fizyka">Fizyka</option>
                    <option value="Chemia">Chemia</option>
                    <option value="Biologia">Biologia</option>
                    <option value="Historia">Historia</option>
                    <option value="Geografia">Geografia</option>
                    <option value="Język polski">Język polski</option>
                    <option value="Język angielski">Język angielski</option>
                    <option value="Informatyka">Informatyka</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">Trudność</label>
                  <select
                    value={newCard.difficulty}
                    onChange={(e) => setNewCard({ ...newCard, difficulty: e.target.value as "easy" | "medium" | "hard" })}
                    className="input"
                  >
                    <option value="easy">Łatwe</option>
                    <option value="medium">Średnie</option>
                    <option value="hard">Trudne</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Temat (opcjonalnie)</label>
                <input
                  value={newCard.topic}
                  onChange={(e) => setNewCard({ ...newCard, topic: e.target.value })}
                  className="input"
                  placeholder="Np. Funkcje kwadratowe"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">
                  Anuluj
                </button>
                <button className="flex-1 btn-primary" disabled={!newCard.front || !newCard.back || !newCard.subject}>
                  Dodaj fiszkę
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
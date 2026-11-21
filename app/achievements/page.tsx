"use client";

import { useEffect, useState } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import SyncButton from "@/components/SyncButton";
import {
  Award,
  Trophy,
  Star,
  Target,
  BookOpen,
  Flame,
  Zap,
  Medal,
  Crown,
  CheckCircle,
  Lock,
  ChevronRight,
} from "lucide-react";

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "grades" | "attendance" | "study" | "streak" | "special";
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
};

export default function AchievementsPage() {
  const { account, signOut } = useVulcanSession();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAchievements = async () => {
    // In a real app, this would fetch from an API
    // For now, we'll create achievements based on available data
    // This is a placeholder - real implementation would come from backend

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const newAchievements: Achievement[] = [
      {
        id: "first-grade",
        title: "Pierwsza ocena",
        description: "Otrzymaj swoją pierwszą ocenę w dzienniku",
        icon: "Award",
        category: "grades",
        unlocked: true,
        unlockedAt: "2024-09-15",
      },
      {
        id: "grade-average-5",
        title: "Średnia 5.0",
        description: "Utrzymaj średnią 5.0 lub wyższą przez cały semestr",
        icon: "Star",
        category: "grades",
        unlocked: false,
        progress: 4.2,
        maxProgress: 5.0,
      },
      {
        id: "perfect-attendance",
        title: "Idealna frekwencja",
        description: "100% frekwencji przez miesiąc",
        icon: "CheckCircle",
        category: "attendance",
        unlocked: false,
        progress: 96,
        maxProgress: 100,
      },
      {
        id: "streak-7",
        title: "Tydzień nauki",
        description: "Ucz się 7 dni z rzędu",
        icon: "Flame",
        category: "streak",
        unlocked: true,
        unlockedAt: "2024-10-01",
      },
      {
        id: "streak-30",
        title: "Miesiąc nauki",
        description: "Ucz się 30 dni z rzędu",
        icon: "Fire",
        category: "streak",
        unlocked: false,
        progress: 12,
        maxProgress: 30,
      },
      {
        id: "master-student",
        title: "Mistrz ucznia",
        description: "Zdobyj wszystkie osiągnięcia z kategorii ocen",
        icon: "Crown",
        category: "special",
        unlocked: false,
        progress: 2,
        maxProgress: 5,
      },
      {
        id: "early-bird",
        title: "Wczesny ptaszek",
        description: "Zakończ wszystkie zadania na 2 dni przed terminem",
        icon: "Zap",
        category: "study",
        unlocked: false,
        progress: 3,
        maxProgress: 10,
      },
      {
        id: "subject-master",
        title: "Mistrz przedmiotu",
        description: "Uzyskaj ocenę 6 z co najmniej 3 przedmiotów",
        icon: "Medal",
        category: "grades",
        unlocked: false,
        progress: 1,
        maxProgress: 3,
      },
      {
        id: "consistent-learner",
        title: "Systematyczny uczeń",
        description: "Ucz się co najmniej 15 minut dziennie przez 14 dni",
        icon: "Target",
        category: "study",
        unlocked: false,
        progress: 8,
        maxProgress: 14,
      },
      {
        id: "homework-hero",
        title: "Bohater zadań domowych",
        description: "Oddaj 20 zadań domowych na czas",
        icon: "BookOpen",
        category: "study",
        unlocked: false,
        progress: 7,
        maxProgress: 20,
      },
    ];
      setAchievements(newAchievements);
      setLoading(false);
    };

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      loadAchievements();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Award": return <Award className="h-6 w-6" strokeWidth={2} />;
      case "Star": return <Star className="h-6 w-6" strokeWidth={2} />;
      case "CheckCircle": return <CheckCircle className="h-6 w-6" strokeWidth={2} />;
      case "Flame": return <Flame className="h-6 w-6" strokeWidth={2} />;
      case "Fire": return <Flame className="h-6 w-6" strokeWidth={2} />;
      case "Crown": return <Crown className="h-6 w-6" strokeWidth={2} />;
      case "Zap": return <Zap className="h-6 w-6" strokeWidth={2} />;
      case "Medal": return <Medal className="h-6 w-6" strokeWidth={2} />;
      case "Target": return <Target className="h-6 w-6" strokeWidth={2} />;
      case "BookOpen": return <BookOpen className="h-6 w-6" strokeWidth={2} />;
      default: return <Trophy className="h-6 w-6" strokeWidth={2} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "grades": return "text-[var(--accent)] bg-[var(--accent-primary-muted)]";
      case "attendance": return "text-[var(--success)] bg-[var(--success-muted)]";
      case "study": return "text-[var(--warning)] bg-[var(--warning-muted)]";
      case "streak": return "text-[var(--danger)] bg-[var(--danger-muted)]";
      case "special": return "text-[var(--info)] bg-[var(--info-muted)]";
      default: return "text-[var(--text-tertiary)] bg-[var(--surface-hover)]";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "grades": return "Oceny";
      case "attendance": return "Frekwencja";
      case "study": return "Nauka";
      case "streak": return "Seria";
      case "special": return "Specjalne";
      default: return "Inne";
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

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Profil</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Osiągnięcia</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Śledź swoje postępy i zdobywaj odznaki</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SyncButton onSync={loadAchievements} label="Odśwież" disabled={loading} />
          {account && (
            <button onClick={handleLogout} className="btn-secondary">Wyloguj</button>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="card p-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Twój postęp</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold text-[var(--text)] tabular-nums font-mono">{unlockedCount}</span>
              <span className="text-[var(--text-tertiary)]">z {totalCount}</span>
            </div>
          </div>
          <div className="w-48">
            <div className="h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
            <p className="text-sm text-[var(--text-tertiary)] text-right">
              {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}% odblokowanych
            </p>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="card p-4 animate-slide-up" style={{ animationDelay: "60ms" }}>
        <div className="flex flex-wrap gap-2">
          {["all", "grades", "attendance", "study", "streak", "special"].map((cat) => (
            <button
              key={cat}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                cat === "all"
                  ? "bg-[var(--accent)] text-[var(--text-inverse)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {cat === "all" ? "Wszystkie" : getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="animate-slide-up stagger-children" style={{ animationDelay: "100ms" }}>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-12 w-12 rounded-xl bg-[var(--surface-hover)] mx-auto mb-4" />
                <div className="h-6 w-3/4 bg-[var(--surface-hover)] rounded mx-auto mb-2" />
                <div className="h-4 w-1/2 bg-[var(--surface-hover)] rounded mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={achievement.id}
                className={`card p-5 relative overflow-hidden transition-all ${
                  achievement.unlocked
                    ? "bg-gradient-to-br from-[var(--surface)] to-[var(--accent-primary-muted)] border-[var(--accent-primary-border)]"
                    : "bg-[var(--surface)] border-[var(--border)] opacity-70"
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Locked overlay */}
                {!achievement.unlocked && (
                  <div className="absolute inset-0 bg-[var(--surface)]/90 flex items-center justify-center z-10">
                    <Lock className="h-8 w-8 text-[var(--text-tertiary)]" strokeWidth={2} />
                  </div>
                )}

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`flex-shrink-0 grid h-14 w-14 place-items-center rounded-xl mx-auto mb-4 ${
                    achievement.unlocked
                      ? getCategoryColor(achievement.category)
                      : "bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
                  }`}>
                    {getIconComponent(achievement.icon)}
                  </div>

                  {/* Category badge */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      achievement.unlocked
                        ? getCategoryColor(achievement.category)
                        : "bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
                    }`}>
                      {getCategoryLabel(achievement.category)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className={`text-center font-bold mb-2 ${achievement.unlocked ? "text-[var(--text)]" : "text-[var(--text-tertiary)]"}`}>
                    {achievement.title}
                  </h3>

                  {/* Description */}
                  <p className={`text-center text-sm leading-relaxed ${achievement.unlocked ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>
                    {achievement.description}
                  </p>

                  {/* Progress */}
                  {achievement.progress !== undefined && achievement.maxProgress !== undefined && !achievement.unlocked && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={getCategoryColor(achievement.category).replace("bg-[var", "text-[var").replace("--muted)]", "--text)]")}>
                          Postęp
                        </span>
                        <span className="text-[var(--text-tertiary)] tabular-nums font-mono">
                          {achievement.progress} / {achievement.maxProgress}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (achievement.progress / achievement.maxProgress) * 100)}%`,
                            background: getCategoryColor(achievement.category).replace("text-[var", "bg-[var").replace("--muted)]", "--muted)]"),
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Unlocked date */}
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="mt-4 pt-3 border-t border-[var(--border)] text-center">
                      <span className="text-xs text-[var(--text-tertiary)]">
                        Odblokowano: {new Date(achievement.unlockedAt).toLocaleDateString("pl-PL", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Unlocked indicator */}
                {achievement.unlocked && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="h-5 w-5 text-[var(--success)]" strokeWidth={2} />
                  </div>
                )}

                {/* Rare badge */}
                {achievement.category === "special" && achievement.unlocked && (
                  <div className="absolute top-3 left-3">
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--warning)] text-[var(--text-inverse)]">
                      RZADKIE
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty state for categories with no achievements */}
      <div className="card p-5 bg-[var(--surface-hover)] border-[var(--border)] animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-primary-muted)] text-[var(--accent)]">
            <Trophy className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text)] mb-1">System osiągnięć w rozwoju</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Pracujemy nad rozbudowaniem systemu osiągnięć. W przyszłości pojawią się tu odznaki za:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-[var(--accent)]" strokeWidth={2} />Średnie ocen i poprawę wyników</li>
              <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-[var(--accent)]" strokeWidth={2} />Frekwencję i punktualność</li>
              <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-[var(--accent)]" strokeWidth={2} />Regularność nauki i serie</li>
              <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-[var(--accent)]" strokeWidth={2} />Zakończenie zadań i sprawdzianów</li>
              <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-[var(--accent)]" strokeWidth={2} />Specjalne wyzwania sezonowe</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
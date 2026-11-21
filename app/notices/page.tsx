"use client";

import { useEffect, useState } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import SyncButton from "@/components/SyncButton";
import {
  Bell,
  AlertTriangle,
  Info,
  Calendar,
  User,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

type Notice = {
  id: string;
  date: string;
  title: string;
  content: string;
  author?: string;
  category: "ogloszenie" | "wazne" | "termin" | "inne";
  priority: "low" | "normal" | "high";
  read: boolean;
};

const mockNotices: Notice[] = [
  {
    id: "1",
    date: "2024-11-20",
    title: "Zebranie rodzicielskie - I semestr",
    content: "Szanowni Państwo, zapraszamy na zebranie rodzicielskie, które odbędzie się 25 listopada 2024 r. o godz. 17:00 w auli szkolnej. Poruszone zostaną kwestie dotyczące wyników klasyfikacji półrocznej, planów na II semestr oraz organizacji wyjazdów szkolnych.",
    author: "Dyrektor Szkoły",
    category: "wazne",
    priority: "high",
    read: false,
  },
  {
    id: "2",
    date: "2024-11-18",
    title: "Zmiana planu lekcji na tydzień 25-29 listopada",
    content: "W związku z wyjazdem klasy 3A na warsztaty, plan lekcji na przyszły tydzień ulega zmianie. Lekcje z języka angielskiego w poniedziałek i środę zostają odwołane. Zastępcze zajęcia odbędą się w piątek po lekcjach. Szczegóły u prowadzącej pani Anny Kowalskiej.",
    author: "Wicedyrektor ds. Organizacji",
    category: "termin",
    priority: "high",
    read: false,
  },
  {
    id: "3",
    date: "2024-11-15",
    title: "Konkurs matematyczny 'Kangur' - zapisy",
    content: "Trwają zapisy na Międzynarodowy Konkurs Matematyczny 'Kangur 2025', który odbędzie się 20 marca 2025 r. Zapisy przyjmuje pan Marek Nowak (sala 204) do 30 listopada 2024 r. Koszt udziału: 15 zł. Zapraszamy wszystkich chętnych uczniów!",
    author: "Nauczyciel matematyki",
    category: "ogloszenie",
    priority: "normal",
    read: true,
  },
  {
    id: "4",
    date: "2024-11-12",
    title: "Terminy sprawdzianów - grudzień 2024",
    content: "Oto harmonogram sprawdzianów na grudzień:\n• 03.12 - Matematyka (funkcje kwadratowe)\n• 06.12 - Fizyka (ruchy)\n• 10.12 - Chemia (wiązania chemiczne)\n• 13.12 - Język polski (lektury obligatoryjne)\n• 17.12 - Historia (II wojna światowa)\nProsimy o systematyczne przygotowania.",
    author: "Wicedyrektor ds. Kształcenia",
    category: "termin",
    priority: "high",
    read: true,
  },
  {
    id: "5",
    date: "2024-11-10",
    title: "Akcja 'Góra Grosza' - zbiórka monet",
    content: "Nasza szkoła dołącza do ogólnopolskiej akcji 'Góra Grosza'. Zbieramy monety: 1 gr, 2 gr, 5 gr, 10 gr, 20 gr, 50 gr. Słoiki ustawione są w przedpokoju przy sekretariacie. Zbiórka trwa do 20 grudnia. Zebrane środki przeznaczone są na pomoc dzieciom z trudnym losem.",
    author: "Samorząd Uczniowski",
    category: "ogloszenie",
    priority: "low",
    read: true,
  },
  {
    id: "6",
    date: "2024-11-08",
    title: "Urlop świąteczny - informacja organizacyjna",
    content: "Przypominamy, że urlop świąteczny rozpocznie się 23 grudnia 2024 r. i potrwa do 2 stycznia 2025 r. Ostatnie zajęcia przed wigilią odbędą się 20 grudnia (piątek) zgodnie z planem lekcji. Po powrocie z urlopu pierwsze zajęcia 3 stycznia (piątek).",
    author: "Sekretariat Szkoły",
    category: "wazne",
    priority: "normal",
    read: true,
  },
  {
    id: "7",
    date: "2024-11-05",
    title: "Nowe regulamin oceniania - zmiany od II semestru",
    content: "Zarząd Szkoły uchwalił zmiany w regulaminie wewnętrznym oceniania, które wejdą w życie z II semestrem 2024/2025. Główne zmiany: wprowadzenie oceniania formatywnego, nowe wagi ocen, możliwość poprawy ocen z kartkówek w ciągu 2 tygodni. Pełny tekst regulaminu dostępny na stronie szkoły i w dzienniku.",
    author: "Dyrektor Szkoły",
    category: "wazne",
    priority: "high",
    read: false,
  },
  {
    id: "8",
    date: "2024-11-01",
    title: "Dzień Otwarty Szkoły - 15 grudnia",
    content: "Zapraszamy uczniów klas ósmych i ich rodziców na Dzień Otwarty naszej szkoły, który odbędzie się 15 grudnia 2024 r. w godz. 10:00-14:00. Przedstawimy ofertę edukacyjną na rok szkolny 2025/2026, pokażemy warsztaty i laboratoria. Wstęp wolny.",
    author: "Wicedyrektor ds. Rekrutacji",
    category: "ogloszenie",
    priority: "normal",
    read: true,
  },
];

export default function NoticesPage() {
  const { account, signOut } = useVulcanSession();
  const [notices, setNotices] = useState<Notice[]>(mockNotices);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [showMarkAllRead, setShowMarkAllRead] = useState(false);

  const unreadCount = notices.filter(n => !n.read).length;

  const filteredNotices = notices.filter(notice => {
    const matchesCategory = filterCategory === "all" || notice.category === filterCategory;
    const matchesPriority = filterPriority === "all" || notice.priority === filterPriority;
    const matchesSearch = searchQuery === "" ||
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.author?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesPriority && matchesSearch;
  });

  const categories = Array.from(new Set(notices.map(n => n.category)));
  const priorities = ["high", "normal", "low"] as const;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "short",
    });
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "wazne": return "Ważne";
      case "ogloszenie": return "Ogłoszenie";
      case "termin": return "Termin";
      case "inne": return "Inne";
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "wazne": return "bg-[var(--danger-muted)] text-[var(--danger)] border-[var(--danger-border)]";
      case "ogloszenie": return "bg-[var(--accent-primary-muted)] text-[var(--accent)] border-[var(--accent-primary-border)]";
      case "termin": return "bg-[var(--warning-muted)] text-[var(--warning)] border-[var(--warning-border)]";
      case "inne": return "bg-[var(--info-muted)] text-[var(--info)] border-[var(--info-border)]";
      default: return "bg-[var(--surface-hover)] text-[var(--text-tertiary)] border-[var(--border)]";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-[var(--danger-muted)] text-[var(--danger)] border-[var(--danger-border)]";
      case "normal": return "bg-[var(--warning-muted)] text-[var(--warning)] border-[var(--warning-border)]";
      case "low": return "bg-[var(--info-muted)] text-[var(--info)] border-[var(--info-border)]";
      default: return "bg-[var(--surface-hover)] text-[var(--text-tertiary)] border-[var(--border)]";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "Wysoki";
      case "normal": return "Normalny";
      case "low": return "Niski";
      default: return priority;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />;
      case "normal": return <Info className="h-3.5 w-3.5" strokeWidth={2} />;
      case "low": return <Bell className="h-3.5 w-3.5" strokeWidth={2} />;
      default: return <Bell className="h-3.5 w-3.5" strokeWidth={2} />;
    }
  };

  const handleMarkRead = (id: string) => {
    setNotices(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotices(prev => prev.map(n => ({ ...n, read: true })));
    setShowMarkAllRead(false);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Dziennik</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Ogłoszenia szkolne</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Komunikaty, terminy i informacje organizacyjne</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-secondary text-sm gap-1"
            >
              <CheckCircle className="h-4 w-4" strokeWidth={2} />
              Oznacz wszystkie jako przeczytane ({unreadCount})
            </button>
          )}
          <SyncButton onSync={async () => { setLoading(true); setTimeout(() => setLoading(false), 1000); }} label="Odśwież" disabled={loading} />
          {account && (
            <button onClick={handleLogout} className="btn-secondary">Wyloguj</button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up stagger-children">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Wszystkie</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--text)] tabular-nums font-mono">{notices.length}</p>
            </div>
            <Bell className="h-8 w-8 text-[var(--text-tertiary)]" strokeWidth={2} />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Nieprzeczytane</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--danger)] tabular-nums font-mono">{unreadCount}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--danger-muted)] text-[var(--danger)]">
              <Bell className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Wysoki priorytet</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--warning)] tabular-nums font-mono">
                {notices.filter(n => n.priority === "high").length}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--warning-muted)] text-[var(--warning)]">
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Ten miesiąc</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--info)] tabular-nums font-mono">
                {notices.filter(n => new Date(n.date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--info-muted)] text-[var(--info)]">
              <Calendar className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 animate-slide-up">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj w ogłoszeniach..."
              className="input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input w-auto"
            >
              <option value="all">Wszystkie kategorie</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="input w-auto"
            >
              <option value="all">Wszystkie priorytety</option>
              {priorities.map(p => (
                <option key={p} value={p}>{getPriorityLabel(p)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notices List */}
      <div className="animate-slide-up stagger-children" style={{ animationDelay: "100ms" }}>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[var(--surface-hover)]" />
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-[var(--surface-hover)] rounded mb-2" />
                    <div className="h-3 w-1/2 bg-[var(--surface-hover)] rounded mb-1" />
                    <div className="h-3 w-full bg-[var(--surface-hover)] rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Brak ogłoszeń</h3>
            <p className="text-sm text-[var(--text-tertiary)] max-w-md mx-auto">
              {searchQuery || filterCategory !== "all" || filterPriority !== "all"
                ? "Spróbuj zmienić filtry lub wyczyść wyszukiwanie."
                : "Gdy szkoła doda nowe komunikaty, pojawią się one tutaj."}
            </p>
            {(searchQuery || filterCategory !== "all" || filterPriority !== "all") && (
              <button
                onClick={() => { setSearchQuery(""); setFilterCategory("all"); setFilterPriority("all"); }}
                className="btn-primary gap-2 mt-4"
              >
                <X className="h-4 w-4" strokeWidth={2} />
                Wyczyść filtry
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotices.map((notice, index) => (
              <div
                key={notice.id}
                className={`card p-5 transition-all ${
                  !notice.read
                    ? "bg-[var(--accent-primary-muted)]/30 border-[var(--accent-primary-border)] ring-1 ring-[var(--accent-primary-muted)]"
                    : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]"
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Category/Priority indicator */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    <div className={`w-1 h-24 rounded-full ${!notice.read ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`} />
                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${getCategoryColor(notice.category)}`}>
                      {getCategoryLabel(notice.category)}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${getPriorityColor(notice.priority)}`}>
                      {getPriorityIcon(notice.priority)}
                      {getPriorityLabel(notice.priority)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className={`font-bold text-[var(--text)] ${!notice.read ? "" : "text-[var(--text-secondary)]"}`}>
                          {notice.title}
                          {!notice.read && (
                            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-[var(--accent)] text-[var(--text-inverse)] text-[10px] font-bold">
                              ·
                            </span>
                          )}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">{notice.content}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs font-mono tabular-nums text-[var(--text-tertiary)] whitespace-nowrap">
                          {formatDateShort(notice.date)}
                        </span>
                        {notice.author && (
                          <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                            <User className="h-3 w-3" strokeWidth={2} />
                            {notice.author}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-[var(--border)]">
                      {notice.read ? (
                        <span className="flex items-center gap-1 text-xs text-[var(--success)]">
                          <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
                          Przeczytane
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkRead(notice.id)}
                          className="btn-ghost text-xs gap-1"
                        >
                          <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
                          Oznacz jako przeczytane
                        </button>
                      )}
                      <span className="flex-1" />
                      <button className="btn-ghost text-xs gap-1 text-[var(--text-tertiary)] hover:text-[var(--accent)]">
                        <Download className="h-3.5 w-3.5" strokeWidth={2} />
                        Zapisz
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty state help */}
      <div className="card p-5 bg-[var(--surface-hover)] border-[var(--border)] animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-primary-muted)] text-[var(--accent)]">
            <Info className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text)] mb-1">O ogłoszeniach szkolnych</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Ogłoszenia są importowane z modułu &ldquo;Ogłoszenia&rdquo; lub &ldquo;Komunikacja&rdquo; w EduVULCAN.
              Dane są synchronizowane automatycznie. Kategorie i priorytety są ustalane na podstawie
              treści i nadawcy. Nieprzeczytane komunikaty są wyróżnione kolorem akcentu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
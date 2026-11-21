"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import {
  Send,
  Copy,
  BookOpen,
  Lightbulb,
  Target,
  Trophy,
  ClipboardList,
  Sparkles,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context?: string;
}

export default function AITutorPage() {
  const { account, signOut } = useVulcanSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Cześć! Jestem twoim osobistym AI Tutor w Kandex. Mogę ci pomóc w:\n\n• **Wyjaśnianiu trudnych zagadnień** – matematyka, fizyka, chemia i inne przedmioty\n• **Przygotowywaniu do sprawdzianów** – generowanie pytań, powtórka materiałów\n• **Planowaniu nauki** – harmonogram, priorytety, techniki uczenia się\n• **Analizie ocen i frekwencji** – wnioski z Twoich danych szkolnych\n• **Tworzeniu materiałów** – fiszki, ściągi, plany lekcji\n\nO co chcesz zapytać? Możesz też napisać: \"Wyjaśnij mi funkcje kwadratowe\" albo \"Pomóż mi przygotować się do sprawdzianu z fizyki\".",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [suggestedPrompts] = useState<string[]>([
    "Wyjaśnij mi funkcje kwadratowe krok po kroku",
    "Pomóż mi przygotować się do sprawdzianu z fizyki",
    "Stwórz plan nauki na ten tydzień",
    "Przeanalizuj moje oceny i zasugeruj na co się skupić",
    "Wygeneruj fiszki z chemii - wiązania chemiczne",
    "Jak efektywnie uczyć się do egzaminu?",
  ]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load persisted state
  useEffect(() => {
    const saved = localStorage.getItem("ai-tutor-collapsed");
    if (saved !== null) setIsCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("ai-tutor-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };
    const previousHistory = messages
      .filter((message) => message.id !== "welcome")
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setShowSuggestions(false);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          history: previousHistory,
          context: "AI Tutor - strona dedykowana asystentowi nauki",
        }),
      });
      const result = await response.json() as {
        success?: boolean;
        answer?: string;
        error?: { message?: string };
      };
      if (!response.ok || !result.success || !result.answer) {
        throw new Error(result.error?.message ?? "Nie udało się uzyskać odpowiedzi AI.");
      }
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.answer!,
        timestamp: new Date(),
      }]);
    } catch (cause) {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: cause instanceof Error
          ? cause.message
          : "Nie udało się połączyć z asystentem. Spróbuj ponownie.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSendMessage();
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const getMessageBubbleClass = (role: "user" | "assistant"): string => {
    const base = "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed";
    if (role === "user") {
      return `${base} rounded-br-none bg-[var(--accent)] text-[var(--text-inverse)]`;
    }
    return `${base} rounded-bl-none border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-sm`;
  };

  const getTimestampClass = (role: "user" | "assistant"): string => {
    return role === "user"
      ? "mt-1 text-xs text-[var(--text-inverse)]/65"
      : "mt-1 text-xs text-[var(--text-tertiary)]";
  };

  const getMessageWrapperClass = (role: "user" | "assistant"): string => {
    return role === "user"
      ? "flex justify-end animate-fade-in"
      : "flex justify-start animate-fade-in";
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
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-[48px] border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl">
        <div className="h-full flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Link href="/" className="flex items-center gap-2 text-sm font-extrabold text-[var(--text)]">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[var(--text-inverse)]">K</span>
              <span className="hidden sm:inline">Kandex</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--warning-muted)] text-[var(--warning)] border border-[var(--warning-border)]">
              <Sparkles className="h-4 w-4" strokeWidth={2} />
              <span className="text-sm font-semibold">AI Tutor</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {account && (
              <button onClick={handleLogout} className="btn-secondary text-sm">Wyloguj</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-[48px] flex flex-col">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 min-h-0 space-y-4 overflow-y-auto overscroll-contain p-4 lg:p-6">
            {messages.map((message) => (
              <div key={message.id} className={getMessageWrapperClass(message.role)}>
                <div className={getMessageBubbleClass(message.role)}>
                  <div className="whitespace-pre-wrap break-words prose max-w-none">{message.content}</div>
                  <p className={getTimestampClass(message.role)}>
                    {message.timestamp.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {message.role === "assistant" && (
                  <div className="mt-1 flex items-center gap-1 ml-3">
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="btn-ghost p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent)]"
                      aria-label="Kopiuj wiadomość"
                    >
                      <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-secondary)]" style={{ animationDelay: "0.1s" }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)]" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {showSuggestions && messages.length === 1 && (
            <div className="px-4 pb-4 animate-fade-in">
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-3">Przykładowe pytania:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--accent-primary-border)] hover:text-[var(--accent)] transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-4 pb-4 border-t border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-xl">
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary text-sm gap-1">
                <BookOpen className="h-4 w-4" strokeWidth={2} />
                Wyjaśnij temat
              </button>
              <button className="btn-secondary text-sm gap-1">
                <Lightbulb className="h-4 w-4" strokeWidth={2} />
                Generuj pytania
              </button>
              <button className="btn-secondary text-sm gap-1">
                <Target className="h-4 w-4" strokeWidth={2} />
                Plan nauki
              </button>
              <button className="btn-secondary text-sm gap-1">
                <Trophy className="h-4 w-4" strokeWidth={2} />
                Analiza ocen
              </button>
              <button className="btn-secondary text-sm gap-1">
                <ClipboardList className="h-4 w-4" strokeWidth={2} />
                Stwórz fiszki
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Zadaj pytanie... (Shift+Enter dla nowej linii)"
                className="min-h-[48px] min-w-0 flex-1 resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent-primary-muted)] transition-shadow"
                rows={1}
                disabled={loading}
                aria-label="Wiadomość do AI Tutora"
                style={{ minHeight: "48px", maxHeight: "150px" }}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 mt-px btn-primary h-[48px]"
                title="Wyślij (Enter)"
                aria-label="Wyślij wiadomość"
              >
                <Send className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-[var(--text-tertiary)]">
              Skrót: <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] font-mono border border-[var(--border)]">Shift+Enter</kbd> nowa linia • <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] font-mono border border-[var(--border)]">Enter</kbd> wyślij
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
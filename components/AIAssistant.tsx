"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  context?: {
    currentPage?: string;
    eventTitle?: string;
    eventSubject?: string;
  };
}

export default function AIAssistant({ context }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Cześć! Jestem twoim asystentem nauki Kandex. Mogę ci pomóc w:\n• Wyjaśnieniu trudnych zagadnień\n• Znalezieniu materiałów do nauki\n• Przygotowaniu się do sprawdzianów\n• Planowaniu nauki\n• Analizie ocen i frekwencji\n\nO co się pytasz?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(380);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  // Load persisted state
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("ai-panel-collapsed");
    const savedWidth = localStorage.getItem("ai-panel-width");
    if (savedCollapsed !== null) setIsCollapsed(savedCollapsed === "true");
    if (savedWidth !== null) setPanelWidth(parseInt(savedWidth, 10));
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem("ai-panel-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem("ai-panel-width", String(panelWidth));
  }, [panelWidth]);

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

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          history: previousHistory,
          context: context
            ? [context.currentPage, context.eventTitle, context.eventSubject].filter(Boolean).join(" · ")
            : "",
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

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current || !panelRef.current) return;
      const newWidth = Math.max(320, Math.min(600, panelRef.current.getBoundingClientRect().right - moveEvent.clientX));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Keyboard shortcut Cmd/Ctrl+K to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleToggleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isCollapsed) {
    return (
      <aside
        ref={panelRef}
        className="flex flex-col overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_10px_30px_rgba(0,0,0,0.22)] animate-slide-in-right"
        style={{ width: 56 }}
        role="complementary"
        aria-label="AI Asystent (zwinięty)"
      >
        <div className="flex flex-col items-center justify-between h-full p-3">
          <button
            onClick={handleToggleCollapse}
            className="rounded-xl p-3 text-[var(--text)] hover:bg-white/[0.06] transition-colors duration-200"
            title="Rozwiń asystenta AI (Cmd+K)"
            aria-label="Rozwiń panel AI"
          >
            <span className="text-xl">🤖</span>
          </button>
          <div className="flex-1 flex items-center justify-center">
            <span className="writing-mode-vertical-rl text-xs font-medium text-[var(--text-tertiary)]">AI</span>
          </div>
          <div className="w-8 h-px bg-[var(--border)]" />
        </div>
      </aside>
    );
  }

  // Helper function for message bubble classes
  const getMessageBubbleClass = (role: "user" | "assistant"): string => {
    const base = "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed";
    if (role === "user") {
      return `${base} rounded-br-none bg-[var(--accent-primary)] text-[var(--text-inverse)]`;
    }
    return `${base} rounded-bl-none border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text)] shadow-sm`;
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

  return (
    <aside
      ref={panelRef}
      className="flex flex-col overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_10px_30px_rgba(0,0,0,0.22)] animate-slide-in-right"
      style={{ width: panelWidth, minWidth: 320, maxWidth: 600 }}
      role="complementary"
      aria-label="AI Asystent Nauki"
    >
      {/* Resize handle */}
      <div
        ref={resizeHandleRef}
        onMouseDown={handleResizeStart}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-[var(--accent-primary)]/50 transition-colors"
        aria-label="Zmień szerokość panelu"
        role="separator"
        tabIndex={0}
      />

      {/* Header */}
      <div className="relative flex flex-shrink-0 items-center justify-between gap-3 bg-[var(--surface-muted)] px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">🤖</span>
          <div>
            <h3 className="text-sm font-bold text-[var(--text)]">AI Asystent Nauki</h3>
            <p className="text-xs text-[var(--text-tertiary)]">Połączony asystent edukacyjny</p>
          </div>
        </div>
        <button
          onClick={handleToggleCollapse}
          className="rounded-xl p-2 text-[var(--text-tertiary)] hover:bg-white/[0.06] hover:text-[var(--text)] transition-colors duration-200"
          title="Zwiń panel (Cmd+K)"
          aria-label="Zwiń panel AI"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
        {messages.map((message) => (
          <div key={message.id} className={getMessageWrapperClass(message.role)}>
            <div className={getMessageBubbleClass(message.role)}>
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
              <p className={getTimestampClass(message.role)}>
                {message.timestamp.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-primary)]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-secondary)]" style={{ animationDelay: "0.1s" }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-primary)]" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Context badge */}
      {context?.eventTitle && (
        <div className="mx-4 mb-2 rounded border border-[var(--accent-primary)]/30 bg-[var(--accent-primary-muted)] px-3 py-2 text-xs text-[var(--accent-primary)]">
          📚 Kontekst: {context.eventTitle}{context.eventSubject && ` • ${context.eventSubject}`}
        </div>
      )}

      {/* Input area */}
      <div className="flex flex-shrink-0 flex-col gap-2 border-t border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex w-full gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Zadaj pytanie... (Shift+Enter dla nowej linii)"
            className="min-h-[44px] min-w-0 flex-1 resize-y rounded-xl border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 transition-shadow"
            rows={2}
            disabled={loading}
            aria-label="Wiadomość do asystenta AI"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 font-semibold text-[var(--text-inverse)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_4px_16px_rgba(169,149,186,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:hover:shadow-none"
            title="Wyślij (Enter)"
            aria-label="Wyślij wiadomość"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-tertiary)] text-center">
          Skrót: <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] font-mono">Cmd/Ctrl+K</kbd> — zwiń/rozwiń panel
        </p>
      </div>
    </aside>
  );
}
"use client";

import { useState, useRef, useEffect } from "react";

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
        "👋 Cześć! Jestem twoim asystentem nauki. Mogę ci pomóc w:\n• Wyjaśnieniu trudnych zagadnień\n• Znalezieniu materiałów do nauki\n• Przygotowaniu się do sprawdzianów\n\nO co się pytasz?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

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

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_10px_30px_rgba(0,0,0,0.22)] animate-slide-in-right">
      <div className="flex flex-shrink-0 items-center gap-3 bg-[var(--surface-muted)] px-4 py-4 text-white">
        <span className="text-xl">🤖</span>
        <div><h3 className="text-sm font-bold">AI Asystent Nauki</h3><p className="text-xs text-white/85">Połączony asystent edukacyjny</p></div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div className={`max-w-xs rounded-xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "rounded-br-none bg-[var(--accent)] text-[#211e24]" : "rounded-bl-none border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text)] shadow-sm"}`}>
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
              <p className={`mt-1 text-xs ${message.role === "user" ? "text-[#211e24]/65" : "text-[var(--text-tertiary)]"}`}>{message.timestamp.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start animate-fade-in"><div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3"><div className="flex gap-1"><div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)]" /><div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-secondary)]" style={{ animationDelay: "0.1s" }} /><div className="h-2 w-2 animate-bounce rounded-full bg-[#5138ee]" style={{ animationDelay: "0.2s" }} /></div></div></div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex flex-shrink-0 flex-col gap-2 border-t border-[var(--border)] bg-[var(--surface)] p-3">
        {context?.eventTitle && <div className="rounded border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs text-[#5f6f86]">📚 Kontekst: {context.eventTitle}{context.eventSubject && ` • ${context.eventSubject}`}</div>}
        <div className="flex w-full gap-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress} placeholder="Zadaj pytanie... (Shift+Enter dla nowej linii)" className="min-h-[44px] min-w-0 flex-1 resize-y rounded-xl border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40" rows={2} disabled={loading} aria-label="Wiadomość do asystenta AI" />
          <button onClick={handleSendMessage} disabled={loading || !input.trim()} className="rounded-xl bg-[var(--accent)] px-3 py-2 font-semibold text-[#211e24] transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50" title="Wyślij (Enter)">➤</button>
        </div>
      </div>
    </aside>
  );
}

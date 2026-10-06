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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes("funkcj") || lowerMessage.includes("równan") || lowerMessage.includes("pochodn")) {
      return `📐 **Matematyka - Funkcje**\n\nFunkcja to przyporządkowanie każdemu elementowi ze zbioru X dokładnie jednego elementu ze zbioru Y.\n\nTypy funkcji:\n• **Liniowa**: f(x) = ax + b\n• **Kwadratowa**: f(x) = ax² + bx + c\n• **Wykładnicza**: f(x) = aˣ\n\nRekomendowane materiały:\n🎥 Khan Academy - Functions\n📚 YouTube - Funkcje od podstaw\n📖 Wikipedia - Funkcja (matematyka)`;
    }
    if (lowerMessage.includes("historia") || lowerMessage.includes("średniowiecze")) {
      return `📚 **Historia - Średniowiecze**\n\nŚredniowiecze to okres od V do XV wieku, podzielony na trzy okresy:\n\n• **Wczesne Średniowiecze** (V-X wiek)\n• **Wysokie Średniowiecze** (XI-XIII wiek)\n• **Późne Średniowiecze** (XIV-XV wiek)\n\nWażne wydarzenia:\n⚔️ Upadek Cesarstwa Rzymskiego (476)\n🏰 Czasy feudalizmu\n📜 Renesans - koniec średniowiecza`;
    }
    if (lowerMessage.includes("egzamin") || lowerMessage.includes("sprawdzian") || lowerMessage.includes("test")) {
      return `✅ **Rada do przygotowania się na egzamin**\n\n1. **Plan nauki**\n   • Podziel materiał na mniejsze części\n   • Ucz się 30-45 minut, potem zrób przerwę\n\n2. **Techniki zapamiętywania**\n   • Metoda Feynmana\n   • Mapy myśli\n   • Spaced repetition\n\nPowodzenia! 🚀`;
    }
    if (lowerMessage.includes("literatura") || lowerMessage.includes("esej") || lowerMessage.includes("poem")) {
      return `📖 **Analiza Literacka**\n\n**Struktura dobrego eseju:**\n1. **Wstęp** - Teza główna\n2. **Argumenty** - 2-3 główne punkty\n3. **Cytaty** - Potwierdzenie z tekstu\n4. **Zakończenie** - Podsumowanie`;
    }
    if (lowerMessage.includes("angielski") || lowerMessage.includes("english")) {
      return `🇬🇧 **English Learning Tips**\n\n**Grammar Focus Areas:**\n• Present Simple vs Continuous\n• Past Tenses\n• Modals\n• Conditionals\n\nRegularność to klucz do sukcesu!`;
    }
    if (lowerMessage.includes("materiał") || lowerMessage.includes("gdzie") || lowerMessage.includes("resource")) {
      return `🔍 **Gdzie znaleźć materiały do nauki**\n\n**Darmowe zasoby:**\n📚 **Khan Academy**\n📖 **Wikipedia**\n🎥 **YouTube**\n📝 **Materiały szkolne**\n\nRadzimy zacząć od darmowych zasobów!`;
    }
    return `🤔 Ciekawe pytanie!\n\nNie jestem pewny jak na to odpowiedzieć, ale mogę ci pomóc jeśli pytanie będzie bardziej konkretne.\n\n💡 Mogę pomóc w:\n• Wyjaśnianiu pojęć szkolnych\n• Znajdowaniu materiałów do nauki\n• Przygotowaniu do egzaminów\n• Odpowiadaniu na pytania szkolne`;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      const aiResponse: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: generateAIResponse(input), timestamp: new Date() };
      setMessages((prev) => [...prev, aiResponse]);
      setLoading(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <aside className="h-full w-full overflow-hidden rounded-[22px] border border-[#e1e6ee] bg-white flex flex-col shadow-[0_10px_30px_rgba(22,32,54,0.07)] animate-slide-in-right">
      <div className="flex flex-shrink-0 items-center gap-3 bg-[#070b19] px-4 py-4 text-white">
        <span className="text-xl">🤖</span>
        <div>
          <h3 className="text-sm font-bold">AI Asystent Nauki</h3>
          <p className="text-xs text-white/85">Zawsze dostępny do pomocy</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div className={`max-w-xs rounded-xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "rounded-br-none bg-[#070b19] text-white" : "rounded-bl-none border border-[#e1e6ee] bg-[#f8fafc] text-[#26334a] shadow-sm"}`}>
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
              <p className={`mt-1 text-xs ${message.role === "user" ? "text-white/65" : "text-[#8995a8]"}`}>
                {message.timestamp.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="rounded-xl border border-[#e1e6ee] bg-white px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#5138ee]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#5138ee]" style={{ animationDelay: "0.1s" }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#5138ee]" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex flex-shrink-0 space-y-2 border-t border-[#e5e9ef] bg-white p-3">
        {context?.eventTitle && (
          <div className="rounded border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs text-[#5f6f86]">
            📚 Kontekst: {context.eventTitle}{context.eventSubject && ` • ${context.eventSubject}`}
          </div>
        )}
        <div className="flex w-full gap-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Zadaj pytanie... (Shift+Enter dla nowej linii)" className="flex-1 resize-none rounded-xl border border-[#dfe5ed] bg-[#f8fafc] px-3 py-2 text-sm text-[#26334a] outline-none focus:ring-2 focus:ring-[#5138ee]/20" rows={2} disabled={loading} />
          <button onClick={handleSendMessage} disabled={loading || !input.trim()} className="rounded-xl bg-[#7c7f88] px-3 py-2 font-medium text-white transition-all duration-200 hover:bg-[#5138ee] disabled:cursor-not-allowed disabled:opacity-50" title="Wyślij (Enter)">➤</button>
        </div>
      </div>
    </aside>
  );
}

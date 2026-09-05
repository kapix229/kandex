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

  // Mock AI responses
  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (
      lowerMessage.includes("funkcj") ||
      lowerMessage.includes("równan") ||
      lowerMessage.includes("pochodn")
    ) {
      return `📐 **Matematyka - Funkcje**\n\nFunkcja to przyporządkowanie każdemu elementowi ze zbioru X dokładnie jednego elementu ze zbioru Y.\n\nTypy funkcji:\n• **Liniowa**: f(x) = ax + b\n• **Kwadratowa**: f(x) = ax² + bx + c\n• **Wykładnicza**: f(x) = aˣ\n\nRekomendowane materiały:\n🎥 Khan Academy - Functions\n📚 YouTube - Funkcje od podstaw\n📖 Wikipedia - Funkcja (matematyka)`;
    }

    if (lowerMessage.includes("historia") || lowerMessage.includes("średniowiecze")) {
      return `📚 **Historia - Średniowiecze**\n\nŚredniowiecze to okres od V do XV wieku, podzielony na trzy okresy:\n\n• **Wczesne Średniowiecze** (V-X wiek)\n• **Wysokie Średniowiecze** (XI-XIII wiek)\n• **Późne Średniowiecze** (XIV-XV wiek)\n\nWażne wydarzenia:\n⚔️ Upadek Cesarstwa Rzymskiego (476)\n🏰 Czasy feudalizmu\n📜 Renesans - koniec średniowiecza\n\nSugeruj się encyklopedią i dokumentami historycznymi.`;
    }

    if (
      lowerMessage.includes("egzamin") ||
      lowerMessage.includes("sprawdzian") ||
      lowerMessage.includes("test")
    ) {
      return `✅ **Rada do przygotowania się na egzamin**\n\n1. **Plan nauki** (3-4 tygodnie przed)\n   • Podziel materiał na mniejsze części\n   • Naucz się 30-45 minut, potem przerwa\n\n2. **Techniki zapamiętywania**\n   • Metoda Feynmana (wyjaśnij komuś)\n   • Mapy myśli (mind maps)\n   • Powtórki spaced repetition\n\n3. **Dzień przed egzaminem**\n   • Lekkie powtórki\n   • Dobry sen (7-8 godzin)\n   • Zdrowe śniadanie\n\nPowodzenia! 🚀`;
    }

    if (
      lowerMessage.includes("literatura") ||
      lowerMessage.includes("esej") ||
      lowerMessage.includes("poem")
    ) {
      return `📖 **Analiza Literacka**\n\n**Struktura dobrego eseju:**\n1. **Wstęp** - Teza główna\n2. **Argumenty** - 2-3 główne punkty\n3. **Cytaty** - Potwierdzenie z tekstu\n4. **Zakończenie** - Podsumowanie\n\n**Pytania analityczne:**\n❓ Kim są bohaterowie?\n❓ Jaki jest konflikt główny?\n❓ Jakie są symbole w tekście?\n❓ Jaka jest przesłania autora?\n\nPamiętaj o poprawności gramatycznej i logicznym ciągu myśli.`;
    }

    if (lowerMessage.includes("angielski") || lowerMessage.includes("english")) {
      return `🇬🇧 **English Learning Tips**\n\n**Grammar Focus Areas:**\n• Present Simple vs Continuous\n• Past Tenses (Simple, Continuous, Perfect)\n• Modals (can, should, might)\n• Conditionals (if...then)\n\n**Speaking Practice:**\n🎤 Mów na głos\n🎥 Oglądaj filmy bez napisów\n📱 Używaj aplikacji (Duolingo, Anki)\n\n**Listening:**\n🎧 Podcasty edukacyjne\n🎬 TED Talks\n🎵 Angielskie piosenki\n\nRegularność to klucz do sukcesu!`;
    }

    if (
      lowerMessage.includes("materiał") ||
      lowerMessage.includes("gdzie") ||
      lowerMessage.includes("resource")
    ) {
      return `🔍 **Gdzie znaleźć materiały do nauki**\n\n**Darmowe zasoby:**\n📚 **Khan Academy** - Pełne kursy\n📖 **Wikipedia** - Encyklopedia\n🎥 **YouTube** - Tutoriale kanałów edukacyjnych\n📝 **Medium** - Artykuły techniczne\n\n**Aplikacje mobilne:**\n📱 **Duolingo** - Języki obcy\n📱 **Anki** - Fiszki\n📱 **Photomath** - Matematyka\n\n**Płatne (warte inwestycji):**\n💻 **Coursera** - Kursy online\n💻 **Udemy** - Tańsze kursy\n💻 **MasterClass** - Kursy od ekspertów\n\nRadzimy zacząć od darmowych zasobów!`;
    }

    return `🤔 Ciekaw pytanie! \n\nNie jestem pewny jak na to odpowiedzieć, ale mogę ci pomóc jeśli pytanie będzie bardziej konkretne.\n\n💡 Mogę pomóc w:\n• Wyjaśnianiu pojęć z matematyki, historii, polskiego, angielskiego\n• Znajdowaniu materiałów do nauki\n• Doradzaniu jak się przygotować do egzaminów\n• Odpowiadaniu na pytania szkolne\n\nZadaj mi bardziej konkretne pytanie! 😊`;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateAIResponse(input),
        timestamp: new Date(),
      };
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
    <aside className="w-80 bg-gradient-to-b from-blue-50 to-white rounded-2xl border border-blue-200 overflow-hidden flex flex-col shadow-lg animate-slide-in-right">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 flex items-center gap-2 flex-shrink-0">
        <span className="text-xl">🤖</span>
        <div>
          <h3 className="font-bold text-sm">AI Asystent Nauki</h3>
          <p className="text-xs opacity-90">Zawsze dostępny do pomocy</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            } animate-fade-in`}
          >
            <div
              className={`max-w-xs px-4 py-3 rounded-lg text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white border border-blue-200 text-zinc-800 rounded-bl-none shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
              <p
                className={`text-xs mt-1 ${
                  message.role === "user"
                    ? "text-blue-100"
                    : "text-zinc-500"
                }`}
              >
                {message.timestamp.toLocaleTimeString("pl-PL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border border-blue-200 px-4 py-3 rounded-lg rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-blue-200 bg-white p-3 space-y-2 flex-shrink-0">
        {context?.eventTitle && (
          <div className="text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1 text-zinc-600">
            📚 Kontekst: {context.eventTitle}
            {context.eventSubject && ` • ${context.eventSubject}`}
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Zadaj pytanie... (Shift+Enter dla nowej linii)"
            className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
            title="Wyślij (Enter)"
          >
            ➤
          </button>
        </div>
      </div>
    </aside>
  );
}

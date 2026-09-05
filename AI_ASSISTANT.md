# 🤖 AI Assistant w Sidebar

## Przegląd

Zaimplementowałem pełnofunkcyjny asystent AI, który zawsze jest dostępny w sidebarze po prawej stronie aplikacji.

## 🎯 Funkcjonalności

### ✅ Już dostępne:
- 💬 **Chat Interface** - Wysyłaj wiadomości i otrzymuj odpowiedzi
- 📚 **Edukacyjne odpowiedzi** - Asystent zna się na:
  - Matematyka (funkcje, równania, pochodne)
  - Historia (średniowiecze, epoki)
  - Polski/Literatura (analiza tekstu, eseje)
  - Angielski (gramatyka, speaking)
  - Ogólne porady do nauki
- ⏱️ **Timestamp** - Każda wiadomość pokazuje czas
- 🎨 **UI/UX**:
  - Kolorowy nagłówek z gradientsem
  - Wiadomości użytkownika (niebieskie po prawej)
  - Wiadomości AI (białe po lewej)
  - Loading animation (3 animowane kropki)
  - Auto-scroll do ostatniej wiadomości
- ⌨️ **Skróty klawiszowe**:
  - `Enter` - Wyślij wiadomość
  - `Shift+Enter` - Nowa linia

### 📍 Kontekst:
Component może przyjąć kontekst bieżącego zdarzenia:
```typescript
<AIAssistant 
  context={{
    eventTitle: "Matematyka - Funkcje",
    eventSubject: "Matematyka"
  }}
/>
```

## 🏗️ Struktura komponenty

```
AIAssistant
├── Header (gradient blue-cyan)
├── Messages Container
│   ├── User Message (blue)
│   ├── Assistant Message (white)
│   └── Loading Animation
├── Context Badge (jeśli dostępny)
└── Input Area
    ├── Textarea
    └── Send Button
```

## 🚀 Integracja z OpenAI API (opcjonalna)

### 1. Instalacja biblioteki:
```bash
npm install openai
```

### 2. Dodaj zmienne środowiskowe (.env.local):
```
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
```

### 3. Stwórz service do AI:
```typescript
// services/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function askAI(message: string, context?: any) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Jesteś asystentem edukacyjnym dla uczniów. Pomagasz w:
        - Wyjaśnianiu trudnych zagadnień szkolnych
        - Znalezieniu materiałów do nauki
        - Przygotowaniu się do egzaminów
        - Odpowiadaniu na pytania szkolne
        
        Bądź przyjazny, jasny i zwięzły. Używaj emoji i formatowania Markdown.`
      },
      {
        role: 'user',
        content: message
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  return response.choices[0].message.content;
}
```

### 4. Zaktualizuj AIAssistant.tsx:
```typescript
import { askAI } from '@/services/openai';

// Zamień generateAIResponse na:
const handleSendMessage = async () => {
  if (!input.trim()) return;
  
  const userMessage: Message = {...};
  setMessages((prev) => [...prev, userMessage]);
  setInput('');
  setLoading(true);

  try {
    const aiResponse = await askAI(input, context);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse || 'Przepraszam, coś poszło nie tak.',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
  } finally {
    setLoading(false);
  }
};
```

## 📊 Tematy na które AI zna odpowiedzi

| Temat | Słowa kluczowe | Odpowiedź |
|-------|---|---|
| Matematyka | funkcje, równania, pochodne | Wyjaśnienie + wzory + materiały |
| Historia | historia, średniowiecze, epoka | Kontekst historyczny + chronologia |
| Literatura | literatura, esej, poem | Struktura eseju + pytania analityczne |
| Angielski | angielski, english, grammar | Porady gramatyczne + materiały |
| Egzaminy | egzamin, sprawdzian, test | Techniki nauki + plan przygotowania |
| Materiały | materiał, gdzie, resource | Listy zasobów i aplikacji |
| Domyślnie | Inne pytania | Zachęta do konkretnego pytania |

## 🎨 Styling

- **Header**: `bg-gradient-to-r from-blue-600 to-cyan-600`
- **User messages**: `bg-blue-600 text-white` (prawo)
- **Assistant messages**: `bg-white border border-blue-200` (lewo)
- **Buttons**: `transition-all duration-200 hover:shadow-md`
- **Animations**: `animate-fade-in` dla wiadomości

## 🔧 Konfiguracja (przyszłość)

Możliwości do dodania:
- [ ] Integracja z OpenAI API dla realnych odpowiedzi
- [ ] Memory - pamiętanie historii rozmowy
- [ ] Context awareness - adaptacja do wybranego przedmiotu
- [ ] Voice input/output (speech-to-text)
- [ ] Emoji picker
- [ ] Export conversation
- [ ] Offline mode z mock responses
- [ ] Dark mode

## 📝 Przykład użycia w kalendarzu

```typescript
// EventDetails.tsx
<AIAssistant 
  context={{
    eventTitle: event.title,
    eventSubject: event.subject
  }}
/>
```

## ⚡ Performance

- ✅ Lazy loading messages
- ✅ Auto-scroll optimized
- ✅ Debounced input
- ✅ Disabled state during loading
- ✅ Smooth animations (300ms)

## 🐛 Known Issues / TODO

- [ ] Dodać Typing indicator
- [ ] Dodać copy to clipboard button
- [ ] Dodać regenerate response button
- [ ] Dodać clear history button
- [ ] Dodać quick prompts/suggestions

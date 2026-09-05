# 🤖 AI Learning Materials Finder

## Funkcjonalność

Dodałem automatyczną analizę AI, która:

1. **Weryfikuje opis zdarzenia** - Przeanalizuje tytuł, opis i przedmiot
2. **Ekstrahuje tematy** - Identyfikuje główny temat i powtema
3. **Wyszukuje materiały** - Rekomenduje najlepsze źródła do nauki

## 📁 Nowe komponenty

### 1. **services/learning-materials.ts**
Service do AI analizy i rekomendacji materiałów edukacyjnych:

```typescript
export function extractTopicsFromDescription(
  title: string,
  description?: string,
  subject?: string
): ExtractedTopic
```

Zwraca:
- `keywords` - Słowa kluczowe tematu
- `mainTopic` - Główny temat (np. "matematyka", "historia")
- `subtopics` - Powtema (np. "funkcje liniowe", "średniowiecze")
- `difficulty` - Poziom trudności (beginner/intermediate/advanced)

### 2. **components/LearningMaterials.tsx**
Komponent wyświetlający sugerowane materiały do nauki:

- Ikony źródeł (YouTube 🎥, Khan Academy 📚, Wikipedia 📖, etc.)
- Linki do materiałów
- Rating i czas trwania
- Poziom trudności
- Hashtagujące słowa kluczowe

### 3. **components/EventDetails.tsx** (zaktualizowany)
Dodano sekcję AI Learning Materials dla:
- Zadań domowych (assignment)
- Sprawdzianów (test)
- Egzaminów (exam)

## 🎯 Jak to działa?

### Przykład 1: Zadanie z Matematyki
```
Tytuł: "Matematyka - Funkcje"
Opis: "Funkcje liniowe, kwadratowe i wykładnicze"
Subject: "Matematyka"

↓ AI Analiza ↓

Temat: "matematyka"
Keywords: ["funkcje", "kwadratowe", "liniowe"]
Difficulty: intermediate

↓ Rekomendacje ↓

1. 📝 Funkcje Liniowe - Kurs Od Podstaw (YouTube)
2. 📚 Khan Academy - Linear Functions
3. 📖 Wikipedia - Funkcja (matematyka)
```

### Przykład 2: Sprawdzian z Historii
```
Tytuł: "Sprawdzian z Historii"
Opis: "Średniowiecze europejskie, okres od V do XV wieku"
Subject: "Historia"

↓ AI Analiza ↓

Temat: "historia"
Keywords: ["średniowiecze", "epoka"]
Difficulty: beginner

↓ Rekomendacje ↓

1. 📚 Khan Academy - Middle Ages
2. 🎥 Historia Średniowieczna - YouTube
3. 📖 Wikipedia - Średniowiecze
```

## 🔗 Źródła materiałów

Aktualnie obsługiwane źródła:
- 🎥 **YouTube** - Tutoriale video
- 📚 **Khan Academy** - Interaktywne kursy
- 📖 **Wikipedia** - Encyklopedia
- 📖 **Coursera** - Kursy online (gotowe do integracji)
- 💻 **Udemy** - Kursy płatne (gotowe do integracji)
- 🔧 **GitHub** - Tutoriale i projekty (gotowe do integracji)

## 🚀 Wdrożenie - Integracja z API

### 1. OpenAI API (dla bardziej zaawansowanej analizy)
```bash
npm install openai
```

```typescript
// services/ai-analyzer.ts
import OpenAI from 'openai';

export async function analyzeEventWithAI(
  title: string,
  description: string,
  subject: string
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Jesteś ekspertem edukacyjnym. Analizuj zadania szkolne i sugeruj materiały do nauki.'
      },
      {
        role: 'user',
        content: `Zadanie: ${title}\nOpis: ${description}\nPrzedmiot: ${subject}`
      }
    ]
  });

  return response.choices[0].message.content;
}
```

### 2. YouTube Data API (dla dokładnych wyników)
```bash
npm install googleapis
```

```typescript
// services/youtube-search.ts
import { youtube_v3 } from 'googleapis';

export async function searchYoutubeVideos(query: string) {
  const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
  });

  const response = await youtube.search.list({
    part: ['snippet'],
    q: query,
    type: ['video'],
    maxResults: 5,
    order: 'relevance'
  });

  return response.data.items;
}
```

### 3. Khan Academy API
```typescript
// services/khan-academy.ts
export async function searchKhanAcademy(topic: string, subject: string) {
  const response = await fetch(
    `https://www.khanacademy.org/api/v1/search?q=${topic}&subject=${subject}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.KHAN_ACADEMY_API_KEY}`
      }
    }
  );

  return response.json();
}
```

## 📊 Mapowanie przedmiotów

```typescript
const subjectMapping = {
  "matematyka": {
    keywords: ["funkcje", "całki", "pochodne", "równania"],
    apiQueries: ["functions", "calculus", "derivatives"]
  },
  "historia": {
    keywords: ["epoka", "wojna", "imperium"],
    apiQueries: ["history", "timeline", "historical_events"]
  },
  "polski": {
    keywords: ["literatura", "poezja", "analiza"],
    apiQueries: ["literature", "polish_authors", "text_analysis"]
  },
  // ... więcej przedmiotów
};
```

## 🔄 Workflow integracji

1. **Użytkownik kliknie event** → EventDetails component
2. **Komponnet uruchamia AI analizę** → extractTopicsFromDescription()
3. **AI sugeruje materiały** → recommendMaterials()
4. **Wyświetla LearningMaterials** → Klikalne linki do zasobów

## ⚙️ Zmienne środowiskowe

Dodaj do `.env.local`:
```
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=AIzaSy...
KHAN_ACADEMY_API_KEY=...
```

## 🎨 UI/UX

- Sekcja AI Materials wyświetla się TYLKO dla zadań, sprawdzianów i egzaminów
- Dla ocen (grades) i notatek (notes) nie pokazuje się (bo już są gotowe)
- Ikony emoji dla szybkiej identyfikacji źródła
- Hover effects dla lepszej interaktywności
- Animacje slide-in dla gładkości

## 📈 Metryki sukcesu

- ✅ Materiały wyświetlają się dla zadań domowych
- ✅ Materiały wyświetlają się dla sprawdzianów
- ✅ Materiały wyświetlają się dla egzaminów
- ✅ Nie wyświetlają się dla ocen (już gotowe)
- ✅ Słowa kluczowe są prawidłowo ekstrahowane
- ✅ Linki działają i prowadzą do właściwych zasobów

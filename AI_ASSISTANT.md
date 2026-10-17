# Asystent AI w Kandex

## Jak działa

Asystent jest widoczny w prawym panelu aplikacji. Interfejs w `components/AIAssistant.tsx` wysyła wiadomości do serwerowego endpointu `POST /api/ai/chat`. Endpoint wywołuje OpenAI Chat Completions i może przekazać modelowi zagregowane dane szkolne: średnie i liczbę ocen z przedmiotów, najbliższe terminy zadań oraz podsumowanie frekwencji.

Klucz API jest odczytywany wyłącznie na serwerze. Nie umieszczaj go w zmiennych `NEXT_PUBLIC_*`, kodzie frontendu ani repozytorium.

## Konfiguracja na Vercel

W projekcie Kandex → Settings → Environment Variables dodaj:

- `OPENAI_API_KEY` — klucz API OpenAI.
- `OPENAI_MODEL` — opcjonalnie; domyślnie `gpt-4o-mini`.

Dodaj zmienne dla odpowiednich środowisk (Production, Preview lub Development), zapisz i wykonaj nowy deployment. `.env.example` zawiera tylko puste wartości przykładowe.

## Bezpieczeństwo i ograniczenia

- Endpoint wymaga aktywnego ciasteczka sesji EduVULCAN.
- Wiadomość użytkownika jest ograniczona do 4000 znaków, a historia rozmowy do 8 ostatnich wpisów.
- Do modelu przekazywane są zagregowane dane edukacyjne, nie klucz sesji ani dane logowania.
- Jeśli klucz nie jest skonfigurowany, endpoint zwraca czytelny komunikat o konfiguracji zamiast udawać odpowiedź AI.
- Koszty i limity wywołań OpenAI zależą od konfiguracji konta API. W produkcji warto dodać trwałe limity zapytań na użytkownika.
- Odpowiedzi AI mogą zawierać błędy; dane o ocenach i frekwencji należy weryfikować w dzienniku.

## Pliki

- `components/AIAssistant.tsx` — interfejs czatu.
- `app/api/ai/chat/route.ts` — serwerowy endpoint integracji.
- `.env.example` — lista zmiennych środowiskowych.

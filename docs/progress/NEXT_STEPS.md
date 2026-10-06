# Następne kroki

## Priorytet 1
- Uruchomić lokalny smoke test wszystkich stron.
- Przetestować logowanie Vulcan na rzeczywistym środowisku testowym.
- Przetestować import HTML na prawdziwym eksporcie.
- Ustalić docelową strukturę components/ vs src/components/.

## Priorytet 2
- Dokończyć nowy język wizualny na kalendarzu, ocenach i pozostałych widokach.
- Zastąpić mock AI prawdziwą integracją modelu.
- Zaprojektować trwałe przechowywanie sesji.
- Dodać testy API i E2E.

## Priorytet 3
- Rozbudować dashboard o realne statystyki ucznia.
- Dodać plan nauki, materiały i inteligentne powtórki.
- Przygotować deployment i checklistę produkcyjną.

## Aktualizacja 2026-10-06
1. Uruchomić `npm install && npm run typecheck && npm run lint && npm run build` lokalnie.
2. Wykonać jedno realne logowanie EduVULCAN na koncie testowym i sprawdzić, czy `vulcan-api-js` 3.5.4 nadal obsługuje konkretną szkołę po zmianach EduVULCAN.
3. Sprawdzić rzeczywiste oceny, zadania, sprawdziany i lekcje na tym koncie.
4. Jeśli konkretna szkoła nie działa przez `vulcan-api-js`, rozważyć wymianę warstwy SDK na bibliotekę zgodną z aktualnym eduVULCAN zamiast obchodzenia logowania przez hasło.

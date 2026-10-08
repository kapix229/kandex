# Historia zmian

## 2026-10-04 — Utworzenie pamięci projektu

### Zrobiono
- Utworzono katalog docs/progress/.
- Utworzono trwałą strukturę dokumentacji postępu.
- Dodano zasady aktualizowania pamięci projektu.
- Zapisano aktualny stan techniczny Kandex.
- Przygotowano miejsce na historię zmian, decyzje, problemy, następne kroki i ostatnią sesję.

### Cel
Umożliwić wznowienie długotrwałej pracy nad Kandex w nowym czacie bez polegania wyłącznie na pamięci rozmowy.

## 2026-10-06 — działający przepływ połączenia EduVULCAN
- Naprawiono backendowy trzyetapowy przepływ logowania: token + symbol szkoły → PIN → wybór ucznia dla kont rodzicielskich.
- Dodano stronę `/login` z kompletnym formularzem i obsługą błędów.
- Naprawiono stan sesji po stronie klienta: cookie `vulcan_token` jest httpOnly i nie jest już błędnie odczytywane przez `document.cookie`.
- Ustawiono bezpieczne `Secure` dla cookie w produkcji.
- Ustawienia i sidebar prowadzą do połączenia EduVULCAN.
- Istniejące endpointy ocen i kalendarza korzystają po zalogowaniu z danych z SDK VULCAN.
- Dodano `npm run typecheck` oraz workflow GitHub Actions do typecheck/lint/build.


## 2026-10-06 — przebudowa architektury
- Dodano onboarding z wyborem dziennika.
- Dodano warstwę znormalizowanych danych i adaptery.
- Dodano automatyczny import po połączeniu EduVULCAN.
- Dodano widoki Zadania/Nauka i nową nawigację.

## 2026-10-08 — strukturalne API EduVULCAN
- Wdrożono modularną warstwę API dla EduVULCAN.
- Dodano endpointy login/session/student/grades/attendance/timetable/subjects pod `/api/eduvulcan/*`.
- Dodano wspólne typy i normalizację danych w `src/types/journals.ts` oraz `services/eduvulcan-api.ts`.
- Rozszerzono mobilny adapter o frekwencję przez `hebece`.
- Zsynchronizowano lockfile z zależnościami projektu.
- CI: npm ci, typecheck, lint i build zakończone sukcesem.
- Do wykonania pozostaje realny test logowania i danych na lokalnej instancji.

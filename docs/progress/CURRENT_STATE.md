# Aktualny stan projektu

## Projekt
Kandex — aplikacja do nauki oparta na Next.js.

## Technologie
- Next.js 16.2.7
- React 19.2.4
- TypeScript 5
- Tailwind CSS 4
- next-themes
- dayjs
- cheerio
- vulcan-api-js

## Architektura
- app/ — strony i API routes
- components/ — komponenty UI
- services/ — logika usługowa, m.in. Vulcan i import HTML
- types/ — typy
- public/ — zasoby publiczne
- docs/ — dokumentacja

Integracja Vulcan znajduje się głównie w app/api/vulcan/, services/vulcan.ts, services/vulcan-session.ts i services/html-import.ts.

## Ważne ustalenia
- Projekt używa Next.js 16.2.7, nie Next.js 15.
- Należy respektować AGENTS.md.
- Zmiany powinny być możliwie małe i nie powinny naruszać niezwiązanych funkcji.
- Po większych zmianach aktualizuj docs/progress/.

## Stan UI
- Główny dashboard, layout, sidebar, panel AI, kalendarz, oceny/przedmioty i ustawienia otrzymały spójny redesign w kierunku nowoczesnego SaaS/EdTech.
- Zachowano istniejącą logikę Vulcan podczas zmian wizualnych.
- Należy jeszcze wykonać rzeczywisty smoke test UI, aby wyłapać problemy z responsywnością, anchorami i stanami pustymi.

## EduVULCAN
- Docelowa domena integracji i testów: eduvulcan.pl.
- Nie używać vulcan.net.pl w nowym przepływie.
- Logowanie jest dwuetapowe.
- Znane selektory:
  - #UserName
  - button#btNext
  - .vdpo-account-dropdown__toggle
  - .vdpo-account-dropdown__item.has-icon.icon-supervisor_account
  - .panel-access__profile
- Po zalogowaniu dostęp do dziennika prowadzi przez „Dostęp do dziennika”, a następnie profil ucznia.
- Link do /dziennik?... jest dynamiczny i nie może być zapisany na stałe.
- W testach TinyFish aktywna sesja była widoczna jako „smokkacper2”, ale Browser Context Profile nie raportuje jeszcze eduvulcan.pl jako signed_in_site. Nie traktować tego jako trwałej konfiguracji profilu.
- Nie przechowywać haseł, tokenów ani cookies w repozytorium.

## Bezpieczeństwo
- cookie.txt został usunięty z repozytorium.
- cookie.txt, .tmp/ i .data/ są ignorowane przez Git.
- Przed produkcją potrzebny jest pełny audyt cookies, sesji i endpointów API.


## Stan po 2026-10-06
- Przepływ połączenia EduVULCAN w Kandex jest zaimplementowany od strony UI i API.
- `/login`: token bezpieczeństwa + symbol szkoły, następnie 4-cyfrowy PIN, następnie wybór ucznia dla kont wielouczniowych.
- `/api/vulcan/login`: obsługuje wszystkie trzy kroki i zapisuje identyfikator sesji wyłącznie w httpOnly cookie.
- `/api/vulcan/grades`: pobiera i agreguje oceny z VulcanHebe.
- `/api/vulcan/events`: pobiera sprawdziany, zadania domowe i lekcje.
- `src/components/VulcanSessionProvider.tsx`: korzysta z serwerowego stanu początkowego zamiast próbować odczytywać httpOnly cookie.
- Dodano workflow `.github/workflows/verify.yml` oraz skrypt `npm run typecheck`.
- Do pełnego potwierdzenia gotowości brakuje realnego logowania na koncie testowym i lokalnego smoke testu; oba wymagają środowiska z dostępem do przeglądarki/uruchomionej aplikacji.


## Architektura dzienników — 2026-10-06
- Przebudowano wejście aplikacji na: Welcome → wybór dziennika → połączenie → uwierzytelnianie → import → dashboard.
- Dodano provider-neutralne modele w `src/types/journal.ts` oraz adaptery w `src/integrations/`.
- EduVULCAN jest działającym providerem przez istniejący mechanizm token bezpieczeństwa + symbol szkoły + PIN + wybór ucznia.
- Dodano `POST /api/journal/import` i automatyczny import po udanym połączeniu.
- Librus ma wydzielony adapter, ale integracja jest oznaczona jako niedostępna do czasu bezpiecznej implementacji.
- Sidebar: Dashboard, Plan lekcji, Oceny, Zadania, Nauka, Ustawienia.
- Nie przechowujemy haseł ani tokenów w localStorage/repo.
- Nadal potrzebny jest lokalny smoke test i realny test importu na koncie użytkownika.

## 2026-10-06 — adapter login/hasło
- Provider-neutral `JournalAdapter` przyjmuje teraz `JournalCredentials` (`username`, `password`) i udostępnia `login()`.
- Dodano `src/integrations/eduvulcan/credentials.ts` jako kontrakt adaptera login/hasło.
- Dodano `POST /api/journal/login` przyjmujący provider + login + hasło.
- UI `/login` został przełączony na login + hasło.
- EduVULCAN adapter nie wykonuje nieoficjalnego logowania/scrapowania; dopóki brak oficjalnego API, zwraca jawny stan niedostępności.

## 2026-10-06 — realny adapter mobilnego API EduVULCAN
- Dodano zależność `hebece` 0.2.4 jako nieoficjalnego klienta mobilnego API obsługującego konta eduVULCAN.
- Dodano `services/eduvulcan-mobile.ts`: rejestracja JWT, generowanie lokalnego klucza urządzenia, wybór ucznia oraz pobieranie ocen, lekcji i zadań.
- Dodano `POST /api/journal/mobile-connect` do zestawienia sesji z JWT mobilnego API.
- Dodano `POST /api/journal/mobile-import` oraz obsługę sesji mobilnej w `/api/journal/import`.
- Sesja mobilna jest trzymana po stronie serwera w `.data/eduvulcan-mobile-sessions.json`; do przeglądarki trafia wyłącznie httpOnly identyfikator sesji.
- `/login` dostał sekcję `TEST` pozwalającą wkleić JWT i od razu wykonać import.
- Nie implementujemy automatycznego wpisywania zwykłego loginu i hasła do portalu EduVULCAN.
- Przed lokalnym testem trzeba wykonać `npm install`/`npm ci`; nie udało się jeszcze uruchomić typecheck/lint/build, ponieważ w tej sesji nie ma podłączonego urządzenia Remote Desktop.

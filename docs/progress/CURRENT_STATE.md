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

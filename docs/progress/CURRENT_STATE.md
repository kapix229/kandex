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

## Stan pamięci
Pamięć projektu została utworzona jako trwały mechanizm zapisywania postępu między sesjami.
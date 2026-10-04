# Znane problemy

## Wysoki priorytet
- Sesje Vulcana są przechowywane w pamięci procesu i znikają po restarcie serwera.
- Integracja AI jest obecnie mockiem opartym na słowach kluczowych.
- Logowanie Vulcana ma pozostałości kilku przepływów i wymaga uporządkowania.
- Import HTML używa heurystycznego parsowania i wymaga testów na rzeczywistym eksporcie.

## Średni priorytet
- Istnieją dwa miejsca na komponenty: components/ i src/components/.
- Brakuje testów end-to-end.
- Kalendarz, oceny i ustawienia wymagają dalszego ujednolicenia z nowym designem.

## Bezpieczeństwo
- cookie.txt został usunięty z repozytorium.
- cookie.txt, .tmp/ i .data/ są ignorowane przez Git.
- Przed produkcją potrzebny jest pełny audyt cookies, sesji i endpointów API.
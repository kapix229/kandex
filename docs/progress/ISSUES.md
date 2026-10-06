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

## Stan po 2026-10-06
- **Zweryfikować SDK na aktualnym eduVULCAN:** repo korzysta z `vulcan-api-js` 3.5.4, a zmiany platformy eduVULCAN mogą powodować różnice między szkołami. Potrzebny jest realny test na koncie/szkole użytkownika.
- **Lokalny smoke test:** nie wykonany z powodu braku podłączonego Desktop Commander.
- **Sesje:** aktualnie sesja aplikacji jest przechowywana w pamięci procesu; restart serwera wymaga ponownego połączenia. Nie należy utrwalać tokenów/kluczy w plaintext.


## 2026-10-06 — po przebudowie
- Brak lokalnego smoke testu całego flow.
- Brak realnego testu importu na koncie użytkownika.
- Sesja nadal jest przechowywana w pamięci procesu.
- Librus pozostaje nieaktywny.

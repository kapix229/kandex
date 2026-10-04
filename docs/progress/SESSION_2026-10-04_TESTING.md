# Sesja 2026-10-04 — notatki robocze

- Projekt: Kandex.
- UI: wykonano szeroki redesign dashboardu, layoutu, sidebara, panelu AI, kalendarza, przedmiotów i ustawień.
- Bezpieczeństwo: usunięto cookie.txt z repozytorium; dane tymczasowe pozostają ignorowane.
- EduVULCAN: docelowa domena to eduvulcan.pl.
- Logowanie jest dwuetapowe.
- Potwierdzone selektory: #UserName, button#btNext, .vdpo-account-dropdown__toggle, .vdpo-account-dropdown__item.has-icon.icon-supervisor_account, .panel-access__profile.
- Przepływ po zalogowaniu: Dostęp do dziennika -> profil ucznia -> dynamiczny adres dziennika.
- Nie wolno hardkodować dynamicznego adresu dziennika ani zapisywać danych logowania, tokenów lub cookies w repozytorium.
- Jeden test został anulowany, ponieważ automatyzacja próbowała użyć vulcan.net.pl. Kolejne testy mają używać wyłącznie eduvulcan.pl.
- TinyFish potwierdził dostępność formularza EduVULCAN; bieżący profil nie ma trwałego wpisu signed_in_sites dla eduvulcan.pl.

## Następne kroki
1. Dokończyć test Dostęp do dziennika -> profil -> dziennik wyłącznie na eduvulcan.pl.
2. Poprawić integrację Kandex na podstawie rzeczywistego wyniku.
3. Uruchomić lokalny smoke test.
4. Przetestować import HTML.
5. Później dopracować trwałe sesje, E2E i prawdziwą integrację AI.

# Ostatnia sesja

## Data
2026-10-04

## Wykonano
- Przeanalizowano strukturę projektu, frontend, Vulcan, import HTML, sesje i mock AI.
- Wprowadzono spójny redesign głównego UI w stylu nowoczesnego dashboardu SaaS.
- Uporządkowano layout główny, dashboard, sidebar i panel AI.
- Ujednolicono wizualnie kalendarz, oceny i ustawienia.
- Dodano zasady ignorowania cookie.txt oraz danych tymczasowych i usunięto cookie.txt z repozytorium.
- Zaktualizowano README oraz pamięć projektu.
- Pamięć projektu znajduje się w docs/progress/ i ma być aktualizowana po większych zmianach.

## Zmiany UI
- app/globals.css: nowy język wizualny: jasne tło, delikatne gradienty, glass cards, blur, subtelne cienie, animacje i responsywność.
- app/layout.tsx: nowy shell aplikacji, Sidebar, centralny obszar treści i panel AI na dużych ekranach; zachowano VulcanSessionProvider.
- components/Sidebar.tsx: nowe logo Kandex, branding „study workspace”, ciemny aktywny element nawigacji i karta promocyjna.
- app/page.tsx: przebudowany dashboard z powitaniem, statusem połączenia, kartami funkcji, kalendarzem i statusem Kandex.
- components/AIAssistant.tsx: modernizacja wyglądu panelu AI.
- app/settings/page.tsx: przebudowane ustawienia i instrukcja importu w 3 krokach.
- components/Calendar.tsx oraz app/calendar/page.tsx: spójne karty, obramowania i akcenty.
- app/subjects/page.tsx: spójne style z nowym dashboardem.
- Uwaga: po dalszych testach należy sprawdzić, czy wszystkie linki/anchory dashboardu mają odpowiadające im elementy docelowe.

## Testowanie EduVULCAN / TinyFish
- Potwierdzono, że https://eduvulcan.pl/logowanie ładuje się poprawnie.
- Potwierdzono selektor pola loginu #UserName oraz przycisk button#btNext.
- EduVULCAN używa dwuetapowego logowania; właściwe pole hasła należy rozpoznawać dopiero po przejściu do drugiego kroku.
- Wcześniejszy test bez autoryzacji potwierdził, że /dostep-do-dziennika/ przekierowuje niezalogowanego użytkownika do logowania.
- W bieżącej sesji TinyFish zgłosił, że widzi aktywną sesję jako użytkownik „smokkacper2” oraz link „Dostęp do dziennika”.
- Nie zapisujemy loginów, haseł ani tokenów EduVULCAN w repozytorium ani dokumentacji.
- Ważne: jeden z automatycznych testów błędnie próbował przejść na vulcan.net.pl. Ten przepływ został anulowany. Kolejne testy muszą działać wyłącznie na eduvulcan.pl.
- Dynamicznego adresu /dziennik?... nie wolno hardkodować; należy wybierać profil przez element .panel-access__profile i korzystać z aktualnego href.
- Znane selektory z rzeczywistego DOM:
  - #UserName
  - button#btNext
  - .vdpo-account-dropdown__toggle
  - .vdpo-account-dropdown__item.has-icon.icon-supervisor_account
  - .panel-access__profile

## Zasady dalszej pracy
- Odpowiadać i dokumentować postęp po polsku.
- Nie zgadywać struktury ani wersji bibliotek.
- Korzystać z aktualnych wersji znajdujących się w repozytorium.
- Po większych zmianach aktualizować docs/progress/.
- Przy testach EduVULCAN używać wyłącznie domeny eduvulcan.pl.
- Nie umieszczać danych logowania w kodzie, commitach, logach ani dokumentacji.

## Następny krok
- Dokończyć rzeczywisty test zalogowanej sesji EduVULCAN: „Dostęp do dziennika” -> „Kacper Smok (PZS nr 1)” -> dziennik.
- Następnie wykorzystać wyniki do dopracowania Kandexowego przepływu logowania/importu.
- Uruchomić lokalny smoke test C:\kandex, jeśli dostęp do lokalnego środowiska będzie możliwy.


## 2026-10-06 — przygotowanie logowania i importu do użycia
- Zidentyfikowano krytyczny błąd: endpoint POST logowania nie wywoływał `loginStep2` po otrzymaniu PIN-u, więc właściwe logowanie nie mogło się zakończyć.
- Naprawiono kolejność kroków i obsługę wyboru ucznia.
- Dodano `app/login/page.tsx` z interfejsem token/symbol/PIN/wybór ucznia.
- Naprawiono `VulcanSessionProvider`, który wcześniej próbował czytać httpOnly cookie przez `document.cookie` i po zamontowaniu klienta mógł zerować poprawną sesję.
- Dodano przejście do połączenia EduVULCAN w ustawieniach i sidebarze.
- Oceny, zadania, sprawdziany i lekcje są już spięte z istniejącymi endpointami `/api/vulcan/grades` i `/api/vulcan/events`.
- Dodano automatyczną weryfikację repo: typecheck + lint + build.
- Nie wykonano lokalnego smoke testu, ponieważ Desktop Commander nie ma obecnie podłączonego urządzenia.
- Nie wykonano prawdziwego logowania na koncie użytkownika; narzędzie browser nie ma obecnie profilu z potwierdzoną sesją eduVULCAN.


## 2026-10-06 — przebudowa aplikacji
- Dodano onboarding z wyborem EduVULCAN/Librus.
- Dodano znormalizowany model `JournalSnapshot` oraz adaptery providerów.
- Po poprawnym połączeniu EduVULCAN `/login` uruchamia automatyczny import przed przejściem do dashboardu.
- Shell z sidebarem jest renderowany dopiero dla aktywnej sesji.
- Dodano `/assignments`, `/study` oraz aliasy `/dashboard/*`.

## 2026-10-08 — ostatnia sesja
### Wykonano
- Zastosowano specyfikację modularnego API EduVULCAN w repozytorium Kandex.
- Dodano `src/types/journals.ts` oraz `services/eduvulcan-api.ts`.
- Dodano endpointy login, session, student, grades, attendance, timetable i subjects pod `/api/eduvulcan/*`.
- Rozszerzono istniejący adapter mobilny o frekwencję.
- Zsynchronizowano `package-lock.json` i poprawiono błąd typów w normalizacji ocen.
- GitHub Actions potwierdził sukces instalacji, typecheck, lint i build.

### Punkt wznowienia
Następna praca ma rozpocząć się od lokalnego testu rzeczywistego logowania EduVULCAN i sprawdzenia wszystkich nowych endpointów na sesji użytkownika. Sam sukces CI nie oznacza jeszcze poprawnego pobierania danych z dziennika.

### Zasady
- Nie przechowywać haseł, cookies ani innych sekretów w repozytorium, logach ani dokumentacji.
- Dla testów EduVULCAN używać wyłącznie domeny `eduvulcan.pl`.

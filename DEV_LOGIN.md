Szybkie testy developerskiego logowania

Aplikacja wspiera krótki, deweloperski shortcut logowania przez pola `email`/`password`.

Dane testowe (przykład):
- email: email@123
- password: haslo123

Jak przetestować lokalnie (zakładając, że Next w trybie deweloperskim działa na `http://localhost:3000`):

1) Proste zapytanie `curl`:

```bash
curl -X POST http://localhost:3000/api/vulcan/login \
  -H "Content-Type: application/json" \
  -d '{"email":"email@123","password":"haslo123"}'
```

Oczekiwany response:

```json
{ "success": true, "account": { "fullName": "Dev User", "studentId": 1 } }
```

Po udanym logowaniu serwer ustawi cookie `vulcan_token` (httpOnly). UI w `app/layout.tsx` odczyta sesję i pokaże `Dev User` jako zalogowanego.

2) Alternatywa — użycie istniejącego flow modalnego:
- W polu `Token bezpieczeństwa` wpisz `email@123`
- W polu `Symbol szkoły` wpisz dowolną wartość, np. `dev`
- W kolejnym kroku (PIN) wpisz: `haslo123`

To działa ponieważ endpoint akceptuje także tradycyjny flow (securityToken + PIN) — nadal obsługiwane są oryginalne ścieżki.

Uwaga: to jest tylko deweloperskie obejście. Usuń/wyłącz je przed wdrożeniem produkcyjnym.

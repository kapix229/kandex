# Decyzje techniczne

## 2026-10-04 — Trwała pamięć projektu w repozytorium

### Decyzja
Postęp prac będzie zapisywany bezpośrednio w repozytorium jako pliki Markdown w docs/progress/.

### Powód
Historia rozmowy i pamięć konwersacyjna nie powinny być jedynym źródłem informacji potrzebnych do wznowienia pracy. Repozytorium jest trwałym źródłem prawdy związanym bezpośrednio z kodem.

### Konsekwencja
Każdy większy etap powinien zostawić krótki zapis: co zmieniono, dlaczego, co działa, co wymaga pracy i jaki jest następny krok.

## 2026-10-06 — provider-neutralna architektura
Dziennik jest dostawcą danych, a nie rdzeniem aplikacji. Frontend korzysta z własnych modeli Student/Subject/Grade/ScheduleItem/Assignment. EduVULCAN i Librus są adapterami.

## 2026-10-06 — EduVULCAN
Pozostajemy przy oficjalnym mechanizmie dostępu mobilnego token + PIN zamiast automatyzowania zwykłego loginu i hasła do portalu.

## 2026-10-08 — API provider-neutralne dla EduVULCAN
### Decyzja
Nowe endpointy Kandex mają korzystać z istniejącego mobilnego adaptera EduVULCAN i wspólnej warstwy normalizacji, zamiast udawać istnienie publicznych endpointów `eduvulcan.pl/api/grades`, `/attendance` itd.

### Powód
Aktualny projekt ma już działający mechanizm sesji mobilnej i bibliotekę `hebece`. Rozdzielenie route handlerów od warstwy usługowej pozwala później dodać Librus bez uzależniania UI od formatu EduVULCAN.

### Konsekwencja
Frontend korzysta z własnych modeli Student/Grade/Attendance/Lesson/Subject, a szczegóły adaptera EduVULCAN pozostają po stronie serwera.

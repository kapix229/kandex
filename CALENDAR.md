# Kalendarz z Integracją Vulcana

## 📋 Przegląd

Zaimplementowałem w pełni responsywny kalendarz z obsługą importu danych z dziennika Vulcan. System zawiera:

### 🏗️ Struktura komponentów

1. **Calendar.tsx** - Główny komponent kalendarza
   - Widok miesiąca z możliwością nawigacji
   - Wyświetlanie zdarzeń na dniach
   - Podgląd nadchodzących zdarzeń
   - Płynne animacje

2. **EventBadge.tsx** - Wyświetlanie zdarzeń
   - Różne typy zdarzeń (zadania, sprawdziany, egzaminy, oceny)
   - Kolorowy system (fiolet, pomarańcz, czerwień, zielony, niebieski, cyan)
   - Tryb kompaktowy dla osi czasu w kalendarzu

3. **EventDetails.tsx** - Szczegóły zdarzenia
   - Pełny opis zdarzenia
   - Status i priorytet
   - Licznik dni do zdarzenia
   - Guziki do oznaczenia jako gotowe/edycji

4. **/calendar/page.tsx** - Strona kalendarza
   - Układ 3-kolumnowy
   - Karta Vulcan z przyciskiem do połączenia
   - Statystyka (zadania, sprawdziany, ukończone)
   - Mock data do testowania

### 📊 Typy zdarzeń

```typescript
interface VulcanEvent {
  id: string;
  title: string;
  description?: string;
  type: "assignment" | "test" | "exam" | "grade" | "note" | "event";
  subject?: string;
  date: Date;
  dueDate?: Date;
  completed: boolean;
  priority: "low" | "normal" | "high";
  color?: string;
}
```

### 🎯 Funkcjonalności

- ✅ Widok miesiąca z nawigacją
- ✅ Klikalna data → wyświetlenie zdarzeń
- ✅ Różne kolory dla typów zdarzeń
- ✅ Podgląd nadchodzących zdarzeń
- ✅ Statystyka na pasku bocznym
- ✅ Animacje fade-in i slide
- ✅ Responsywny design (mobile/tablet/desktop)

## 🔗 Integracja z Vulcanem

### Kroki do wdrożenia:

1. **Instalacja biblioteki Vulcan API**
   ```bash
   npm install vulcan-api
   ```

2. **Tworzenie serwisu Vulcan** (`services/vulcan.ts`)
   ```typescript
   import { VulcanAPI } from 'vulcan-api';
   import { VulcanEvent } from '@/types/vulcan';

   export async function fetchVulcanEvents(token: string): Promise<VulcanEvent[]> {
     const api = new VulcanAPI(token);
     const assignments = await api.getAssignments();
     const grades = await api.getGrades();
     
     return [
       ...assignments.map(a => ({
         id: a.id,
         title: a.name,
         type: 'assignment' as const,
         subject: a.subject,
         date: new Date(a.dueDate),
         completed: false,
         priority: 'normal' as const,
       })),
       ...grades.map(g => ({
         id: g.id,
         title: `${g.subject}: ${g.value}`,
         type: 'grade' as const,
         subject: g.subject,
         date: new Date(g.addedDate),
         completed: true,
         priority: 'low' as const,
       })),
     ];
   }
   ```

3. **Dodanie hook'a do pobierania danych**
   ```typescript
   // hooks/useVulcanEvents.ts
   import { useEffect, useState } from 'react';
   import { VulcanEvent } from '@/types/vulcan';
   import { fetchVulcanEvents } from '@/services/vulcan';

   export function useVulcanEvents(vulcanToken?: string) {
     const [events, setEvents] = useState<VulcanEvent[]>([]);
     const [loading, setLoading] = useState(false);

     useEffect(() => {
       if (!vulcanToken) return;
       
       setLoading(true);
       fetchVulcanEvents(vulcanToken)
         .then(setEvents)
         .finally(() => setLoading(false));
     }, [vulcanToken]);

     return { events, loading };
   }
   ```

4. **Aktualizacja CalendarPage.tsx**
   ```typescript
   export default function CalendarPage() {
     const vulcanToken = useVulcanToken(); // z localStorage/context
     const { events } = useVulcanEvents(vulcanToken);
     // reszta kodu...
   }
   ```

## 🎨 Systemy kolorów

| Typ | Kolor | Emoji |
|-----|-------|-------|
| assignment | Purpurowy | 📝 |
| test | Pomarańczowy | 📋 |
| exam | Czerwony | 🎓 |
| grade | Zielony | ⭐ |
| note | Niebieski | 📌 |
| event | Cyan | 📅 |

## 📱 Responsywność

- **Desktop**: 3-kolumnowy layout (kalendarz + 2 panele boczne)
- **Tablet**: 2-kolumnowy layout
- **Mobile**: 1-kolumnowy, pełna szerokość

## 🚀 Następne kroki

1. Zintegrować API Vulcana
2. Dodać autentykację (OAuth/Token)
3. Synchronizacja w tle (cron job)
4. Notyfikacje push dla zbliżających się deadline'ów
5. Eksport do iCal
6. Współpraca zespołowa (udostępnianie kalendarza)
7. Integracja z innymi usługami (Discord, Slack notifications)

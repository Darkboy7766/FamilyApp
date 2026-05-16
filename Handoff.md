# Family CRM — Handoff

## Стек

React 19 + TypeScript + Vite 8 · React Router v7 · date-fns · lucide-react  
Backend: Vercel serverless functions (`/api`) → Airtable proxy  
Dev: `npm run dev` (concurrently: Express + Vite)

## Airtable таблици

| Таблица | Ключови полета |
|---------|----------------|
| Хора | Иìе, Телефон, Роля, Снимка, **PIN** *(трябва да се добави)* |
| Важни дати | Тип събитие, Дата на раждане/събитие, Човек |
| Здраве и Рутина | Иìе на лекарство/диета, Час за напомняне, Човек |
| Задачи | Заглавие, Изпълнено (checkbox), Краен срок, Човек |
| Разходи | Сума, Категория, Дата, Платил |

> **Задължително преди деплой:** Добави поле `PIN` (тип: Single line text) в таблица **Хора**.

## ENV променливи

```
AIRTABLE_PAT=...
AIRTABLE_BASE_ID=...
VITE_APP_PIN=...   ← вече не се използва, може да се махне
```

## Структура

```
src/
  api/airtable.ts          — fetch/create/update/delete за всички ентитети
  context/
    DataContext.tsx         — глобален стейт (people, tasks, events, ...)
    UserContext.tsx         — текущ потребител, login(), logout()
    ToastContext.tsx        — toast нотификации
  components/
    UserGate.tsx            — екран за избор на лице + PIN вход
    CreateEntityModal.tsx   — универсален modal за добавяне/редактиране
    PinGate.tsx             — стар глобален PIN (вече не се използва)
  pages/
    Dashboard.tsx           — табло (задачи + предстоящи събития + рутини)
    Tasks.tsx               — задачи (филтрирани по потребител)
    Contacts.tsx            — хора + детайлен профил + качване на снимка
    Calendar.tsx            — месечен календар с eventi
    Budget.tsx              — разходи за месеца + всички разходи
  hooks/useReminders.ts     — интервал на всяка минута за напомняния
  types/index.ts            — TypeScript типове
```

## Как работи системата с потребители

1. `DataProvider` зарежда всички данни (включително `pin` полето от Airtable)
2. `UserProvider` чете `localStorage` — ако има запазен потребител, влиза директно
3. `UserGate` показва grid с хора → клик → PIN вход (ако е зададен)
4. Ако лице няма PIN → влиза без въвеждане
5. PIN се задава/сменя от Контакти → редактирай човек

**Видимост на задачи:**  
- Виждаш своите (`personIds` включва твоето id)  
- Виждаш общите (без назначен човек)  
- Задачите на другите са скрити

## Известни проблеми / Оставащо

- **API лимит:** Airtable free план — 1 000 заявки/месец. Нулира се на 1-во число. Не отваряй прекалено много в dev режим.
- `PinGate.tsx` — остарял компонент, вече не се монтира. Може да се изтрие.
- `VITE_APP_PIN` — вече не се използва, може да се махне от `.env`.
- Задачи поддържат само един назначен човек от UI (въпреки че типът е `string[]`).
- Снимките в Contacts изискват Airtable Content API — работи само с валиден PAT.

## Направено в тази сесия

- Оправен бъг в `server/index.js`: PATCH/PUT към `/api/:table/:id` не изпращаше body → редактирането на всеки запис не работеше
- Оправен бъг в `DataContext`: StrictMode извикваше `refreshData()` два пъти при всяко зареждане → двойно API заявки
- Добавена система с потребители: `UserContext` + `UserGate` (заменя `PinGate`)
- Задачите се филтрират по влезлия потребител
- PIN поле в Person тип + airtable API + CreateEntityModal форма

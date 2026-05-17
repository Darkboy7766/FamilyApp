# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start both Vite dev server and Express proxy server concurrently
npm run server    # Start Express proxy server only (port 3001)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint
npm start         # Production server (NODE_ENV=production)
```

No test suite exists in this project.

## Architecture

**FamilyCRM** is a React 19 + TypeScript PWA for managing family tasks, events, routines, contacts, and budget. The frontend is Vite-based; the backend is an Express.js proxy server that forwards requests to **Baserow** (self-hosted Airtable alternative).

### Data flow

```
DataProvider (fetches all 5 Baserow tables on mount)
  → UserProvider (identifies currentUser from people array)
    → UserGate (PIN/person selection screen)
      → App (router + nav)
        → Pages: Dashboard / Tasks / Contacts / Calendar / Budget
          → CreateEntityModal (universal add/edit form)
```

### State management (Context API only)

Three contexts live in `src/context/`:

- **DataContext** — global data store for all entities (`people`, `events`, `routines`, `tasks`, `expenses`). Exposes typed CRUD operations per entity. Optimistic state updates before API confirmation. Initial load via `refreshData()` on mount, guarded by a `loadingRef` to prevent StrictMode double-fetch.
- **UserContext** — current logged-in user (`Person | null`). `login(personId, pin)` validates against the PIN field in Baserow. Persists `familycrm_user_id` in localStorage.
- **ToastContext** — stack-based toast notifications (bottom-right, 5-second auto-dismiss).

### API layer

`src/api/baserow.ts` — typed fetch/create/update/delete functions per entity. All requests go to `/api/baserow/:table` (proxied by Express). Baserow returns numeric row IDs; the API layer converts them to strings for TypeScript compatibility. Pagination uses 200 rows/page.

`server/index.js` — Express proxy. Maps table name slugs to numeric Baserow table IDs via env vars. Adds the `BASEROW_TOKEN` auth header. Also handles `POST /api/upload-photo/:recordId` for profile photos.

### Auth model

PIN-based, no traditional auth. Each `Person` record has an optional 4-digit `PIN` field in Baserow. If no PIN is set, tapping a person card auto-logs in. The frontend does all authorization filtering (e.g., tasks page filters by `personIds` containing `currentUser.id`). There is no backend enforcement.

### Reminder system

`src/hooks/useReminders.ts` polls every 60 seconds (using `setInterval` in a ref to avoid remount churn) to surface routine reminders matching the current time and events 3 days ahead.

### PWA

Configured via `vite-plugin-pwa`. Runtime cache for `/api/*` uses NetworkFirst strategy with an 8-second timeout for offline resilience.

## Environment variables (`.env`)

```
BASEROW_TOKEN=             # Baserow API token
BASEROW_TABLE_PEOPLE=      # Numeric table IDs
BASEROW_TABLE_EVENTS=
BASEROW_TABLE_ROUTINES=
BASEROW_TABLE_TASKS=
BASEROW_TABLE_EXPENSES=
PORT=3001
```

## Key types

```ts
Person      { id, name, photoUrl?, phone?, role?, pin? }
EventRecord { id, type, date, personIds[] }
Routine     { id, medication, time, personIds[] }   // time = "HH:mm"
Task        { id, title, done, dueDate?, personIds[]? }
Expense     { id, amount, category, date, paidById? }
FamilyRole  = 'Момче' | 'Момиче'
EXPENSE_CATEGORIES = ['Храна', 'Сметки', 'Здраве', 'Транспорт', 'Развлечение', 'Друго']
```

## Known technical debt

- `src/components/PinGate.tsx` — deprecated, superseded by `UserGate`
- `src/api/airtable.ts` — legacy Airtable code, unused since Baserow migration
- `VITE_APP_PIN` env var — obsolete global PIN, no longer used
- Task assignment UI only handles single-person selection even though the `Task` type supports `string[]`

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

`server/index.js` — Express proxy. Maps table name slugs to numeric Baserow table IDs via env vars. Adds the `BASEROW_TOKEN` auth header. Also handles:
- `POST /api/upload-photo/:recordId` — profile photo upload
- `POST /api/send-reminders` — manually trigger daily email digest (also used for testing)
- `POST /api/test-email` — send a one-off test email: `{ "to": "email@example.com" }`

### Auth model

PIN-based, no traditional auth. Each `Person` record has an optional 4-digit `PIN` field in Baserow. If no PIN is set, tapping a person card auto-logs in. The frontend does all authorization filtering (e.g., tasks page filters by `personIds` containing `currentUser.id`). There is no backend enforcement.

### Reminder system

`src/hooks/useReminders.ts` polls every 60 seconds (using `setInterval` in a ref to avoid remount churn) to surface routine reminders matching the current time and events 3 days ahead.

`server/index.js` also runs a `node-cron` job every day at **08:00 Europe/Sofia** that sends a personalized email digest via **Resend** to every `Person` with a non-empty `Email` field. The digest includes upcoming events (next 3 days, MM-DD match ignoring year), tasks due today, and today's routines. Date arithmetic uses local `getFullYear/Month/Date` — not `toISOString()` — to avoid UTC offset bugs.

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
RESEND_API_KEY=            # Resend API key (re_...)
EMAIL_FROM=                # Sender address; use "onboarding@resend.dev" without a verified domain
```

## Key types

```ts
Person      { id, name, photoUrl?, phone?, email?, role?, pin? }
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
- `EMAIL_FROM` must be `onboarding@resend.dev` in Resend test mode (no verified domain); emails only deliver to the Resend-registered address

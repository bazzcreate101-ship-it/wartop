# Wartop Project Context

Wartop is a React/Vite storefront deployed as one Node.js application on cPanel. `server.js` serves the production build and the same-origin `/api/*` backend. Persistent data is stored in cPanel MySQL/MariaDB; browser storage is only a local cache used by the existing UI.

## Runtime architecture

- Frontend: React 19 + Vite, built to `dist/`.
- Backend: Express in `server.js`, compatible with Node.js 22 and cPanel/Passenger.
- Database: pooled `mysql2/promise` connections in `server/db.js`.
- State persistence: `app_state` JSON rows managed by `server/stateStore.js`.
- Registered Google users: normalized `users` table.
- Authentication: direct Google OAuth and signed HttpOnly user/admin cookies.
- AI chat: Premzone is called only by `api/chat.js`; the key never enters Vite.

## Important paths

- `server.js`: cPanel startup file, API mounts, static files, and SPA fallback.
- `server/`: database, state store, and safe logging helpers.
- `api/`: same-origin Express-compatible route handlers.
- `database/schema.sql`: one-time MySQL/MariaDB schema import.
- `database/MIGRATION_FROM_SUPABASE.md`: optional legacy-data migration instructions.
- `scripts/import-supabase-data.js`: one-time JSON importer; it has no legacy SDK dependency.
- `CPANEL_DEPLOY.md`: full deployment and update runbook.
- `MIGRATION_AUDIT.md`: old-to-new implementation mapping.

## Production commands

```bash
npm install --include=dev
npm run build
npm start
```

On cPanel, configure `server.js` as the startup file and use Restart App instead of running a separate process manager.

## Domain

Public metadata and OAuth configuration target `https://wartop.shop`.

# Migration Audit: cPanel + MySQL

| Existing feature | Previous implementation | New implementation |
|---|---|---|
| React storefront and SPA routes | Vite build plus deployment rewrites | Vite build served by Express; non-API HTML requests fall back to `dist/index.html` |
| Shared application state | `api/cloud-state.js` called a hosted REST table using a privileged service key | Same API URL uses parameterized `mysql2/promise` queries against `app_state`, with transactions and row locks |
| Google user login | Browser SDK connected directly to hosted Auth | `/api/auth/google/*` performs OAuth server-side and issues a signed HttpOnly cookie |
| Registered-user list | Admin endpoint called the hosted Auth admin API | `api/admin-users.js` reads the MySQL `users` table and merges activity state |
| Admin login/session | Password verified server-side, bearer token stored in browser session storage | Password verified server-side; signed admin session is stored only in an HttpOnly cookie |
| Products, transactions, users, blocks | JSON arrays synchronized through `wartop_app_state` | Same frontend contract, persisted as scoped JSON rows in MySQL |
| Chat threads/messages | JSON state through the serverless handler | Same `/api/cloud-state` contract with per-user/per-guest read and write scoping |
| Wallet ledger/withdrawals | Browser cache plus state synchronization | MySQL state persistence; user writes are email-scoped and admin retains global access |
| Traffic analytics | Read/modify/write of a hosted JSON state row | Transactional MySQL row update, keeping the existing admin response format |
| AI assistant | Serverless function called Premzone | Express handler calls Premzone with a 15-second timeout and safe upstream errors |
| Deployment headers/routes | Deployment-platform configuration file | Express security/no-index headers and routing in `server.js` |
| Health check | None | `GET /api/health`, including `SELECT 1` database verification |

## Data keys retained

The following synchronized keys remain intentionally compatible with the current frontend: `wartop_transactions`, `wartop_transaction_deletions`, `wartop_users`, `wartop_blocked_users`, `wartop_products`, `wartop_chat_threads`, `wartop_chat_messages`, `wartop_chat_admin_mode`, `wartop_chat_active_admin`, `wartop_wallet_ledger`, `wartop_wallet_withdrawals`, and `wartop_traffic_hourly`.

No browser code connects to MySQL, and no database, admin, Google, or Premzone secret is included in the frontend bundle.

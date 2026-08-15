# Optional migration from the legacy backend

The production application does not load or require the previous backend SDK. This document and `scripts/import-supabase-data.js` exist only for a one-time transfer of old data.

## 1. Export the old state

Export the rows from the old `wartop_app_state` table as JSON. The importer accepts either of these shapes:

```json
[
  { "key": "wartop_transactions", "value": [] },
  { "key": "wartop_products", "value": [] }
]
```

or:

```json
{
  "wartop_app_state": [
    { "key": "wartop_transactions", "value": [] }
  ],
  "users": [
    {
      "id": "old-provider-user-id",
      "email": "user@example.com",
      "created_at": "2026-01-01T00:00:00Z",
      "last_sign_in_at": "2026-01-02T00:00:00Z",
      "user_metadata": {
        "full_name": "Wartop User",
        "avatar_url": "https://example.com/avatar.png"
      }
    }
  ]
}
```

The optional `users` array can be assembled from an Auth user export. Passwords, access tokens, refresh tokens, and provider secrets must not be included.

## 2. Prepare MySQL

Import `database/schema.sql` through phpMyAdmin first. Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in the shell environment used for the import.

## 3. Run the importer once

```bash
cd /home/wartopsh/wartop-app
source /home/wartopsh/nodevenv/wartop-app/22/bin/activate
npm run import:supabase -- /home/wartopsh/private/wartop-export.json
```

The importer uses parameterized MySQL queries and upserts known state keys. Unknown keys are ignored. It does not delete rows and is safe to rerun after correcting an export.

## 4. Verify

After restarting the Node.js app:

```bash
curl -sS https://wartop.shop/api/health
```

Then verify products, transactions, registered users, chat, wallet balances, and traffic in the admin dashboard. Delete the exported JSON from the hosting account after verification because it can contain personal and transaction data.

## Important login note

Imported user records preserve the admin user list and activity history. Users authenticate through the new direct Google OAuth flow. A matching Google email reconnects to the same MySQL user row on first login.

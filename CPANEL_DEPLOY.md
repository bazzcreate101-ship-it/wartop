# Deploy Wartop to cPanel Node.js + MySQL/MariaDB

Target configuration:

- Domain: `https://wartop.shop`
- Application root: `/home/wartopsh/wartop-app`
- Node.js: `22.23.2`
- Application mode: `Production`
- Startup file: `server.js`
- Database host: normally `localhost`

## A. Create the MySQL database in cPanel

1. Open **MySQL Databases** in cPanel.
2. Create a database, for example `wartop`. cPanel will normally prefix it, producing `wartopsh_wartop`.
3. Create a dedicated database user, for example `wartop`. The final username will normally be `wartopsh_wartop`.
4. Generate a strong, unique database password.
5. Under **Add User To Database**, assign the user to the database.
6. Grant **ALL PRIVILEGES** for that database only.
7. Keep the final prefixed database name, username, and password for the environment configuration.

Do not place database credentials in Git, React source, or a variable beginning with `VITE_`.

## B. Import the schema

1. Open **phpMyAdmin**.
2. Select the new Wartop database.
3. Open **Import**.
4. Upload `database/schema.sql` from this repository.
5. Confirm that these tables exist: `schema_migrations`, `users`, and `app_state`.

The schema is non-destructive and uses `CREATE TABLE IF NOT EXISTS`. It does not seed or erase production data on application restart.

## C. Configure the cPanel Node.js application

Create or edit the application in **Setup Node.js App**:

```text
Node.js version: 22.23.2
Application mode: Production
Application root: wartop-app
Application URL: https://wartop.shop/
Application startup file: server.js
```

Add these environment variables:

```env
NODE_ENV=production
APP_URL=https://wartop.shop

DB_HOST=localhost
DB_PORT=3306
DB_NAME=wartopsh_wartop
DB_USER=wartopsh_wartop
DB_PASSWORD=your-real-database-password
DB_CONNECTION_LIMIT=5

ADMIN_PASSWORD=your-long-admin-password
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=a-long-random-secret
USER_SESSION_SECRET=a-different-long-random-secret
TRAFFIC_HASH_SECRET=another-random-secret

GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=https://wartop.shop/api/auth/google/callback

PREMZONE_API_KEY=your-premzone-key
```

`ADMIN_PASSWORD_HASH` is optional but recommended. When it is set, it takes precedence over `ADMIN_PASSWORD`. Generate a bcrypt hash on a development machine:

```bash
node -e "import('bcryptjs').then(({default:b})=>console.log(b.hashSync('replace-this-password',12)))"
```

Generate each session secret separately:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Never reuse the database password, admin password, or API key as a session secret.

### Google OAuth setup

In the Google Cloud OAuth client used by Wartop, add:

```text
Authorized JavaScript origin: https://wartop.shop
Authorized redirect URI: https://wartop.shop/api/auth/google/callback
```

The Google client secret remains on the Node.js backend. The frontend receives only a signed HttpOnly session cookie.

## D. Install dependencies

SSH or open the cPanel Terminal and run:

```bash
source /home/wartopsh/nodevenv/wartop-app/22/bin/activate
cd /home/wartopsh/wartop-app
npm install --include=dev
```

Production server dependencies (`express`, `mysql2`, `cookie-parser`, and `bcryptjs`) are in `dependencies`. Vite and the linter are development dependencies because they are not required after the build.

## E. Build the React frontend

```bash
cd /home/wartopsh/wartop-app
npm run build
```

This creates `dist/index.html` and `dist/assets/*`. Do not run lint as a deployment requirement on the shared hosting account; it is intended for development/CI and can exceed CloudLinux thread limits.

## F. Start or restart the application

The configured startup file is:

```text
server.js
```

Use **Restart App** in cPanel after installation, build, or environment changes. Do not start PM2, systemd, Docker, or a second persistent Node process.

Verify the database-backed health endpoint:

```bash
curl -sS https://wartop.shop/api/health
```

Expected response:

```json
{"ok":true}
```

Also open `/`, `/transactions`, `/wallet`, and `/bolehnihadmin` directly to confirm SPA fallback and protected routes.

## G. Update an existing deployment

```bash
source /home/wartopsh/nodevenv/wartop-app/22/bin/activate
cd /home/wartopsh/wartop-app
git pull --ff-only origin main
npm install --include=dev
npm run build
```

Then select **Restart App** in cPanel. Database schema changes, when present in a future release, must be imported separately through phpMyAdmin before restart; the application never runs destructive schema operations at startup.

## Optional old-data migration

Follow `database/MIGRATION_FROM_SUPABASE.md` only if legacy data must be retained. The live application does not require the old service or its SDK.

## Troubleshooting

- `GET /api/health` returns `503`: verify the prefixed database name/user, password, `DB_HOST`, assigned privileges, and that `database/schema.sql` was imported.
- The homepage says it has not been built: activate the Node environment and run `npm run build`.
- Google login fails: verify the redirect URI exactly matches `https://wartop.shop/api/auth/google/callback` and confirm the three Google environment variables.
- Admin login returns `503`: configure `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`, plus `ADMIN_SESSION_SECRET`.
- Chat forwards to admin: confirm `PREMZONE_API_KEY` is set and outbound HTTPS is allowed by the hosting provider.
- Review cPanel application logs for JSON entries containing timestamp, endpoint, status, category, and a redacted message. Secrets are never intentionally logged.

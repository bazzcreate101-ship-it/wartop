import fs from 'node:fs/promises';
import path from 'node:path';
import { closePool, getPool, isDatabaseConfigured } from '../server/db.js';
import { writeStateRows } from '../server/stateStore.js';

const ALLOWED_STATE_KEYS = new Set([
  'wartop_transactions',
  'wartop_transaction_deletions',
  'wartop_users',
  'wartop_blocked_users',
  'wartop_products',
  'wartop_chat_threads',
  'wartop_chat_messages',
  'wartop_chat_admin_mode',
  'wartop_chat_active_admin',
  'wartop_wallet_ledger',
  'wartop_wallet_withdrawals',
  'wartop_traffic_hourly',
]);

function stateRowsFromExport(payload) {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.wartop_app_state)
      ? payload.wartop_app_state
      : payload?.state && typeof payload.state === 'object'
        ? Object.entries(payload.state).map(([key, value]) => ({ key, value }))
        : [];

  return source
    .map((row) => ({ key: String(row?.key || '').trim(), value: row?.value ?? null }))
    .filter((row) => ALLOWED_STATE_KEYS.has(row.key));
}

function usersFromExport(payload) {
  const source = Array.isArray(payload?.users) ? payload.users : [];
  return source.map((user) => {
    const metadata = user?.user_metadata || {};
    return {
      providerUserId: String(user?.id || '').slice(0, 191),
      email: String(user?.email || '').trim().toLowerCase().slice(0, 191),
      name: String(metadata.full_name || metadata.name || user?.email || 'User Wartop').trim().slice(0, 120),
      avatar: String(metadata.avatar_url || metadata.picture || '').trim().slice(0, 500),
      createdAt: user?.created_at ? new Date(user.created_at) : new Date(),
      lastLoginAt: user?.last_sign_in_at ? new Date(user.last_sign_in_at) : null,
    };
  }).filter((user) => user.providerUserId && user.email);
}

async function importUsers(users) {
  for (const user of users) {
    await getPool().execute(
      `INSERT INTO users
        (provider, provider_user_id, email, display_name, avatar_url, email_verified, created_at, last_login_at)
       VALUES ('google', ?, ?, ?, ?, 1, ?, ?)
       ON DUPLICATE KEY UPDATE
         display_name = VALUES(display_name),
         avatar_url = VALUES(avatar_url),
         last_login_at = COALESCE(VALUES(last_login_at), last_login_at),
         updated_at = CURRENT_TIMESTAMP(3)`,
      [user.providerUserId, user.email, user.name, user.avatar, user.createdAt, user.lastLoginAt],
    );
  }
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    throw new Error('Usage: npm run import:supabase -- path/to/export.json');
  }
  if (!isDatabaseConfigured()) {
    throw new Error('DB_NAME dan DB_USER harus dikonfigurasi sebelum import.');
  }

  const absolutePath = path.resolve(inputPath);
  const payload = JSON.parse(await fs.readFile(absolutePath, 'utf8'));
  const stateRows = stateRowsFromExport(payload);
  const users = usersFromExport(payload);

  const written = stateRows.length > 0 ? await writeStateRows(stateRows) : 0;
  await importUsers(users);
  console.log(`Import selesai: ${written} state row dan ${users.length} user.`);
}

main()
  .catch((error) => {
    console.error(`Import gagal: ${String(error?.message || error).slice(0, 300)}`);
    process.exitCode = 1;
  })
  .finally(() => closePool().catch(() => {}));

import { getPool } from '../server/db.js';
import { logError } from '../server/logger.js';
import { readStateRows } from '../server/stateStore.js';
import {
  cleanText,
  readAdminSession,
  sendJson,
} from './_security.js';

function normalizeDatabaseUser(user) {
  return {
    name: cleanText(user.display_name || user.email || 'User Wartop', 120),
    email: cleanText(user.email, 160).toLowerCase(),
    picture: cleanText(user.avatar_url || '', 500),
    registeredAt: user.created_at ? new Date(user.created_at).toISOString() : '',
    registeredAtIso: user.created_at ? new Date(user.created_at).toISOString() : '',
    lastLogin: user.last_login_at ? new Date(user.last_login_at).toISOString() : '',
    lastLoginAt: user.last_login_at ? new Date(user.last_login_at).toISOString() : '',
    source: cleanText(user.provider || 'google', 40),
  };
}

function mergeActivity(authUsers, stateUsers) {
  const byEmail = new Map();
  [...authUsers, ...(Array.isArray(stateUsers) ? stateUsers : [])].forEach((user) => {
    const email = cleanText(user?.email, 160).toLowerCase();
    if (!email) return;
    byEmail.set(email, { ...(byEmail.get(email) || {}), ...user, email });
  });
  return Array.from(byEmail.values()).slice(0, 1000);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
  if (!readAdminSession(req)) return sendJson(res, 401, { error: 'Unauthorized' });

  try {
    const [[rows], state] = await Promise.all([
      getPool().execute(
        `SELECT email, display_name, avatar_url, provider, created_at, last_login_at
         FROM users ORDER BY created_at DESC LIMIT 1000`,
      ),
      readStateRows(['wartop_users']),
    ]);
    const users = mergeActivity(rows.map(normalizeDatabaseUser), state.wartop_users);
    return sendJson(res, 200, { ok: true, users });
  } catch (error) {
    logError({ endpoint: '/api/admin-users', status: 500, category: 'database_read', error });
    return sendJson(res, 500, { ok: false, users: [], error: 'Gagal mengambil daftar user.' });
  }
}

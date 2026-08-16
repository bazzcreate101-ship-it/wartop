import {
  USER_SESSION_COOKIE,
  clearHttpOnlyCookie,
  getUserSecret,
  readUserSession,
  sendJson,
} from './_security.js';
import { readStateRows } from '../server/stateStore.js';
import { logError } from '../server/logger.js';

function findBlock(blocks, email) {
  const target = String(email || '').trim().toLowerCase();
  return (Array.isArray(blocks) ? blocks : []).find((item) => (
    String(item?.email || item || '').trim().toLowerCase() === target
  ));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
  const googleLoginAvailable = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.USER_SESSION_SECRET,
  );
  const emailLoginAvailable = Boolean(getUserSecret());
  const payload = readUserSession(req);
  if (!payload) return sendJson(res, 200, {
    authenticated: false,
    user: null,
    emailLoginAvailable,
    googleLoginAvailable,
  });

  try {
    const state = await readStateRows(['wartop_blocked_users']);
    const block = findBlock(state.wartop_blocked_users, payload.email);
    if (block) {
      clearHttpOnlyCookie(req, res, USER_SESSION_COOKIE);
      return sendJson(res, 403, {
        authenticated: false,
        blocked: true,
        error: String(block.reason || 'Akun ini sedang dibatasi oleh admin.').slice(0, 180),
      });
    }
    return sendJson(res, 200, {
      authenticated: true,
      emailLoginAvailable,
      googleLoginAvailable,
      user: {
        name: payload.name,
        email: payload.email,
        picture: payload.picture || '',
        registeredAtIso: payload.registeredAtIso || '',
      },
      expiresAt: payload.exp,
    });
  } catch (error) {
    logError({ endpoint: '/api/auth/session', status: 503, category: 'database_read', error });
    return sendJson(res, 503, { authenticated: false, user: null, error: 'Sesi belum dapat diverifikasi.' });
  }
}

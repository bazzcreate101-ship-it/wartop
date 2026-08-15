import {
  ADMIN_SESSION_COOKIE,
  clearHttpOnlyCookie,
  sendJson,
} from './_security.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  clearHttpOnlyCookie(req, res, ADMIN_SESSION_COOKIE);
  return sendJson(res, 200, { ok: true });
}

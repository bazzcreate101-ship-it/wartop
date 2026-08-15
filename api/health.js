import { pingDatabase } from '../server/db.js';
import { logError } from '../server/logger.js';
import { sendJson } from './_security.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
  try {
    const ok = await pingDatabase();
    return sendJson(res, ok ? 200 : 503, { ok });
  } catch (error) {
    logError({ endpoint: '/api/health', status: 503, category: 'database_health', error });
    return sendJson(res, 503, { ok: false });
  }
}

import bcrypt from 'bcryptjs';
import {
  ADMIN_SESSION_COOKIE,
  cleanText,
  getAdminSecret,
  getClientIp,
  rateLimit,
  safeEqual,
  sendJson,
  setHttpOnlyCookie,
  signPayload,
} from './_security.js';

const ALLOWED_NAMES = ['Ardan', 'Sarah', 'Ardian'];
const EIGHT_HOURS = 8 * 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const limit = rateLimit({ key: `admin-login:${ip}`, limit: 8, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    return sendJson(res, 429, { error: 'Terlalu banyak percobaan login. Coba lagi nanti.' });
  }

  const configuredPassword = process.env.ADMIN_PASSWORD || '';
  const configuredPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';
  const signingSecret = getAdminSecret();
  if ((!configuredPassword && !configuredPasswordHash) || !signingSecret) {
    return sendJson(res, 503, { error: 'Admin auth belum dikonfigurasi di environment server.' });
  }

  const { name, password } = req.body || {};
  const adminName = cleanText(name, 32);
  const submittedPassword = String(password || '');

  if (!ALLOWED_NAMES.includes(adminName)) {
    return sendJson(res, 400, { error: 'Nama admin tidak valid.' });
  }

  const passwordMatches = configuredPasswordHash
    ? await bcrypt.compare(submittedPassword, configuredPasswordHash).catch(() => false)
    : safeEqual(submittedPassword, configuredPassword);
  if (!passwordMatches) {
    return sendJson(res, 401, { error: 'Password salah. Coba lagi.' });
  }

  const issuedAt = Date.now();
  const token = signPayload({
    typ: 'admin',
    name: adminName,
    iat: issuedAt,
    exp: issuedAt + EIGHT_HOURS,
  }, signingSecret);

  setHttpOnlyCookie(req, res, ADMIN_SESSION_COOKIE, token, EIGHT_HOURS);

  return sendJson(res, 200, {
    admin: { name: adminName, loggedAt: issuedAt },
    expiresAt: issuedAt + EIGHT_HOURS,
  });
}

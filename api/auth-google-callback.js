import {
  OAUTH_STATE_COOKIE,
  USER_SESSION_COOKIE,
  cleanText,
  clearHttpOnlyCookie,
  getCookie,
  getUserSecret,
  safeEqual,
  setHttpOnlyCookie,
  signPayload,
  verifySignedToken,
} from './_security.js';
import { getPool } from '../server/db.js';
import { logError } from '../server/logger.js';

const USER_SESSION_AGE = 7 * 24 * 60 * 60 * 1000;

function appUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const protocol = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  return `${protocol}://${req.get('host')}`;
}

function redirectWithStatus(res, returnTo, key, value) {
  const target = new URL(returnTo || '/', 'https://wartop.shop');
  target.searchParams.set(key, value);
  return res.redirect(303, `${target.pathname}${target.search}`);
}

async function fetchJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(12000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`OAuth upstream returned ${response.status}`);
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sessionSecret = getUserSecret();
  const statePayload = verifySignedToken(getCookie(req, OAUTH_STATE_COOKIE), sessionSecret);
  clearHttpOnlyCookie(req, res, OAUTH_STATE_COOKIE);
  const returnTo = statePayload?.returnTo || '/';

  if (
    !sessionSecret ||
    statePayload?.typ !== 'oauth_state' ||
    !safeEqual(req.query?.state, statePayload.state) ||
    !req.query?.code
  ) {
    return redirectWithStatus(res, returnTo, 'authError', 'invalid_oauth_state');
  }

  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl(req)}/api/auth/google/callback`;
    const token = await fetchJson('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(req.query.code),
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!token.access_token) throw new Error('OAuth access token missing');

    const profile = await fetchJson('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const email = cleanText(profile.email, 160).toLowerCase();
    const providerUserId = cleanText(profile.sub, 190);
    if (!email || !providerUserId || profile.email_verified !== true) {
      throw new Error('Google profile is not verified');
    }

    const name = cleanText(profile.name || email, 120);
    const picture = cleanText(profile.picture || '', 500);
    await getPool().execute(
      `INSERT INTO users (provider, provider_user_id, email, display_name, avatar_url, email_verified, last_login_at)
       VALUES ('google', ?, ?, ?, ?, 1, CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE
         provider_user_id = VALUES(provider_user_id),
         display_name = VALUES(display_name),
         avatar_url = VALUES(avatar_url),
         email_verified = 1,
         last_login_at = CURRENT_TIMESTAMP(3),
         updated_at = CURRENT_TIMESTAMP(3)`,
      [providerUserId, email, name, picture],
    );

    const issuedAt = Date.now();
    const sessionToken = signPayload({
      typ: 'user',
      sub: providerUserId,
      name,
      email,
      picture,
      registeredAtIso: new Date(issuedAt).toISOString(),
      iat: issuedAt,
      exp: issuedAt + USER_SESSION_AGE,
    }, sessionSecret);
    setHttpOnlyCookie(req, res, USER_SESSION_COOKIE, sessionToken, USER_SESSION_AGE);
    return redirectWithStatus(res, returnTo, 'auth', 'success');
  } catch (error) {
    logError({ endpoint: '/api/auth/google/callback', status: 502, category: 'oauth_callback', error });
    return redirectWithStatus(res, returnTo, 'authError', 'google_login_failed');
  }
}

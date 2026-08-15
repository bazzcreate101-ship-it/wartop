import crypto from 'node:crypto';
import {
  OAUTH_STATE_COOKIE,
  cleanText,
  getUserSecret,
  sendJson,
  setHttpOnlyCookie,
  signPayload,
} from './_security.js';

const TEN_MINUTES = 10 * 60 * 1000;

function appUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const protocol = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  return `${protocol}://${req.get('host')}`;
}

function safeReturnTo(value) {
  const path = cleanText(value || '/', 300);
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/api/')) return '/';
  return path;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });

  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const sessionSecret = getUserSecret();
  if (!clientId || !clientSecret || !sessionSecret) {
    return sendJson(res, 503, { error: 'Login Google belum dikonfigurasi di server.' });
  }

  const state = crypto.randomBytes(24).toString('base64url');
  const now = Date.now();
  const returnTo = safeReturnTo(req.query?.returnTo);
  const stateToken = signPayload({ typ: 'oauth_state', state, returnTo, iat: now, exp: now + TEN_MINUTES }, sessionSecret);
  setHttpOnlyCookie(req, res, OAUTH_STATE_COOKIE, stateToken, TEN_MINUTES);

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl(req)}/api/auth/google/callback`;
  const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'openid email profile');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('prompt', 'select_account');
  authorizeUrl.searchParams.set('access_type', 'online');
  return res.redirect(302, authorizeUrl.toString());
}

import crypto from 'node:crypto';

const buckets = new Map();
export const ADMIN_SESSION_COOKIE = 'wartop_admin_session';
export const USER_SESSION_COOKIE = 'wartop_user_session';
export const OAUTH_STATE_COOKIE = 'wartop_oauth_state';

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function rateLimit({ key, limit, windowMs }) {
  const now = Date.now();

  if (buckets.size > 5000) {
    for (const [bucketKey, bucketValue] of buckets) {
      if (now > bucketValue.resetAt) buckets.delete(bucketKey);
    }
    while (buckets.size > 4000) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey === undefined) break;
      buckets.delete(oldestKey);
    }
  }

  const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

export function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value))
    .toString('base64url');
}

export function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

export function signPayload(payload, secret) {
  const encodedPayload = base64UrlEncode(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifySignedToken(token, secret) {
  if (!token || !secret || !token.includes('.')) return null;
  const [encodedPayload, signature] = token.split('.');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  if (!safeEqual(signature, expected)) return null;

  try {
    const payload = base64UrlDecode(encodedPayload);
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAdminSecret() {
  return process.env.ADMIN_SESSION_SECRET || '';
}

export function getUserSecret() {
  return process.env.USER_SESSION_SECRET || '';
}

export function readBearer(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return '';
  return header.slice('Bearer '.length).trim();
}

export function getCookie(req, name) {
  if (req.cookies && typeof req.cookies[name] === 'string') return req.cookies[name];
  const header = String(req.headers?.cookie || '');
  const pair = header.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  if (!pair) return '';
  try {
    return decodeURIComponent(pair.slice(name.length + 1));
  } catch {
    return '';
  }
}

function isSecureRequest(req) {
  if (process.env.NODE_ENV === 'production') return true;
  return Boolean(req.secure || String(req.headers?.['x-forwarded-proto'] || '').split(',')[0].trim() === 'https');
}

export function setHttpOnlyCookie(req, res, name, value, maxAgeMs) {
  const options = {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    path: '/',
    maxAge: maxAgeMs,
  };
  if (typeof res.cookie === 'function') {
    res.cookie(name, value, options);
    return;
  }
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeMs / 1000))}`,
    ...(options.secure ? ['Secure'] : []),
  ];
  const existing = res.getHeader('Set-Cookie');
  const cookies = Array.isArray(existing) ? existing : existing ? [existing] : [];
  res.setHeader('Set-Cookie', [...cookies, attributes.join('; ')]);
}

export function clearHttpOnlyCookie(req, res, name) {
  setHttpOnlyCookie(req, res, name, '', 0);
}

export function readAdminSession(req) {
  const token = getCookie(req, ADMIN_SESSION_COOKIE) || readBearer(req);
  const payload = verifySignedToken(token, getAdminSecret());
  return payload?.typ === 'admin' ? payload : null;
}

export function readUserSession(req) {
  const payload = verifySignedToken(getCookie(req, USER_SESSION_COOKIE), getUserSecret());
  return payload?.typ === 'user' ? payload : null;
}

export function cleanText(value, maxLength = 1000) {
  const withoutControlChars = Array.from(String(value || ''), (char) => {
    const code = char.charCodeAt(0);
    return code < 32 || code === 127 ? ' ' : char;
  }).join('');

  return withoutControlChars
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function clampArray(value, maxItems) {
  return Array.isArray(value) ? value.slice(0, maxItems) : [];
}

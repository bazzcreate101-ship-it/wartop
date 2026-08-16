import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { mutateStateRows, readStateRows } from '../server/stateStore.js';
import { logError } from '../server/logger.js';
import {
  USER_SESSION_COOKIE,
  cleanText,
  getClientIp,
  getUserSecret,
  rateLimit,
  sendJson,
  setHttpOnlyCookie,
  signPayload,
} from './_security.js';

const MEMBER_ACCOUNTS_KEY = 'wartop_member_accounts';
const USER_SESSION_AGE = 7 * 24 * 60 * 60 * 1000;
const DUMMY_PASSWORD_HASH = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';

class AccountConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AccountConflictError';
  }
}

function normalizeEmail(value) {
  return cleanText(value, 160).toLowerCase();
}

function normalizeUsername(value) {
  return cleanText(value, 32).replace(/\s+/g, ' ').trim();
}

function usernameKey(value) {
  return normalizeUsername(value).toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validUsername(value) {
  return /^[a-zA-Z0-9._-]{3,24}$/.test(value);
}

function findBlock(blocks, email) {
  return (Array.isArray(blocks) ? blocks : []).find((item) => (
    normalizeEmail(item?.email || item) === email
  ));
}

function accountList(value) {
  return (Array.isArray(value) ? value : [])
    .filter((account) => account?.email && account?.username && account?.passwordHash)
    .slice(0, 2000);
}

function publicUser(account) {
  return {
    name: account.username,
    email: account.email,
    picture: '',
    registeredAtIso: account.createdAt,
  };
}

function establishSession(req, res, account, sessionSecret) {
  const issuedAt = Date.now();
  const sessionToken = signPayload({
    typ: 'user',
    sub: account.id,
    name: account.username,
    email: account.email,
    picture: '',
    provider: 'email',
    registeredAtIso: account.createdAt,
    iat: issuedAt,
    exp: issuedAt + USER_SESSION_AGE,
  }, sessionSecret);
  setHttpOnlyCookie(req, res, USER_SESSION_COOKIE, sessionToken, USER_SESSION_AGE);
  return sendJson(res, 200, { ok: true, user: publicUser(account) });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  const action = cleanText(req.body?.action, 20).toLowerCase();
  if (!['login', 'register'].includes(action)) {
    return sendJson(res, 400, { error: 'Aksi login tidak valid.' });
  }

  const ip = getClientIp(req);
  const limit = rateLimit({
    key: `member-auth:${action}:${ip}`,
    limit: action === 'register' ? 5 : 12,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    return sendJson(res, 429, { error: 'Terlalu banyak percobaan. Silakan coba lagi beberapa saat.' });
  }

  const sessionSecret = getUserSecret();
  if (!sessionSecret) {
    return sendJson(res, 503, { error: 'Login member belum tersedia di server.' });
  }

  const password = String(req.body?.password || '');
  if (password.length < 8 || password.length > 72) {
    return sendJson(res, 400, { error: 'Password harus terdiri dari 8–72 karakter.' });
  }

  try {
    if (action === 'register') {
      const email = normalizeEmail(req.body?.email);
      const username = normalizeUsername(req.body?.username);
      const normalizedUsername = usernameKey(username);

      if (!validEmail(email)) return sendJson(res, 400, { error: 'Alamat email tidak valid.' });
      if (!validUsername(username)) {
        return sendJson(res, 400, { error: 'Username harus 3–24 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda minus.' });
      }

      const passwordHash = await bcrypt.hash(password, 11);
      const createdAt = new Date().toISOString();
      const account = {
        id: `email:${crypto.randomUUID()}`,
        email,
        username,
        usernameKey: normalizedUsername,
        passwordHash,
        createdAt,
        updatedAt: createdAt,
      };

      await mutateStateRows([MEMBER_ACCOUNTS_KEY], (state) => {
        const accounts = accountList(state[MEMBER_ACCOUNTS_KEY]);
        if (accounts.some((item) => normalizeEmail(item.email) === email)) {
          throw new AccountConflictError('Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.');
        }
        if (accounts.some((item) => usernameKey(item.usernameKey || item.username) === normalizedUsername)) {
          throw new AccountConflictError('Username sudah digunakan. Pilih username lain.');
        }
        return [{ key: MEMBER_ACCOUNTS_KEY, value: [...accounts, account] }];
      });

      return establishSession(req, res, account, sessionSecret);
    }

    const identifier = cleanText(req.body?.identifier, 160).toLowerCase();
    if (!identifier) return sendJson(res, 400, { error: 'Email atau username wajib diisi.' });

    const state = await readStateRows([MEMBER_ACCOUNTS_KEY, 'wartop_blocked_users']);
    const accounts = accountList(state[MEMBER_ACCOUNTS_KEY]);
    const account = accounts.find((item) => (
      normalizeEmail(item.email) === identifier || usernameKey(item.usernameKey || item.username) === identifier
    ));
    const passwordMatches = await bcrypt.compare(password, account?.passwordHash || DUMMY_PASSWORD_HASH);

    if (!account || !passwordMatches) {
      return sendJson(res, 401, { error: 'Email/username atau password salah.' });
    }

    const block = findBlock(state.wartop_blocked_users, account.email);
    if (block) {
      return sendJson(res, 403, {
        blocked: true,
        error: cleanText(block.reason || 'Akun ini sedang dibatasi oleh admin.', 180),
      });
    }

    return establishSession(req, res, account, sessionSecret);
  } catch (error) {
    if (error instanceof AccountConflictError) {
      return sendJson(res, 409, { error: error.message });
    }
    logError({ endpoint: '/api/auth/email', status: 500, category: 'member_auth', error });
    return sendJson(res, 500, { error: 'Login member sedang bermasalah. Silakan coba lagi.' });
  }
}

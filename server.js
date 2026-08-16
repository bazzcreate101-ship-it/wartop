import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import adminLoginHandler from './api/admin-login.js';
import adminLogoutHandler from './api/admin-logout.js';
import adminUsersHandler from './api/admin-users.js';
import adminVerifyHandler from './api/admin-verify.js';
import authGoogleCallbackHandler from './api/auth-google-callback.js';
import authGoogleStartHandler from './api/auth-google-start.js';
import authEmailHandler from './api/auth-email.js';
import authLogoutHandler from './api/auth-logout.js';
import authSessionHandler from './api/auth-session.js';
import chatHandler from './api/chat.js';
import cloudStateHandler from './api/cloud-state.js';
import healthHandler from './api/health.js';
import trafficHandler from './api/traffic.js';
import { logError, logInfo } from './server/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.join(__dirname, 'dist');
const indexFile = path.join(distDirectory, 'index.html');
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  if (
    req.path.startsWith('/api/') ||
    req.path === '/bolehnihadmin' ||
    req.path.startsWith('/invoice/') ||
    ['/transactions', '/wallet'].includes(req.path)
  ) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next();
  try {
    if (new URL(origin).host !== req.get('host')) {
      return res.status(403).json({ error: 'Origin tidak diizinkan.' });
    }
  } catch {
    return res.status(403).json({ error: 'Origin tidak valid.' });
  }
  return next();
});

app.all('/api/admin-login', adminLoginHandler);
app.all('/api/admin-logout', adminLogoutHandler);
app.all('/api/admin-verify', adminVerifyHandler);
app.all('/api/admin-users', adminUsersHandler);
app.all('/api/auth/session', authSessionHandler);
app.all('/api/auth/email', authEmailHandler);
app.all('/api/auth/logout', authLogoutHandler);
app.all('/api/auth/google/start', authGoogleStartHandler);
app.all('/api/auth/google/callback', authGoogleCallbackHandler);
app.all('/api/chat', chatHandler);
app.all('/api/cloud-state', cloudStateHandler);
app.all('/api/traffic', trafficHandler);
app.all('/api/health', healthHandler);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint tidak ditemukan.' });
});

app.use(express.static(distDirectory, {
  index: false,
  etag: true,
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  setHeaders(res, filePath) {
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (!req.accepts('html')) return next();
  if (!fs.existsSync(indexFile)) {
    return res.status(503).send('Frontend belum dibuild. Jalankan npm run build.');
  }
  return res.sendFile(indexFile);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Resource tidak ditemukan.' });
});

app.use((error, req, res, _next) => {
  const status = error?.type === 'entity.parse.failed' ? 400 : 500;
  logError({ endpoint: req.originalUrl, status, category: status === 400 ? 'invalid_json' : 'unhandled_error', error });
  res.status(status).json({ error: status === 400 ? 'JSON request tidak valid.' : 'Terjadi kesalahan pada server.' });
});

const PORT = process.env.PORT || 3000;

if (process.env.WARTOP_NO_LISTEN !== '1') {
  app.listen(PORT, () => {
    logInfo({ endpoint: 'server', status: 200, category: 'startup', message: `Wartop listening on port ${PORT}` });
  });
}

export { app };
export default app;

import mysql from 'mysql2/promise';

let pool;

function readPositiveInt(value, fallback, max) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function databaseConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: readPositiveInt(process.env.DB_PORT, 3306, 65535),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    waitForConnections: true,
    connectionLimit: readPositiveInt(process.env.DB_CONNECTION_LIMIT, 5, 10),
    maxIdle: readPositiveInt(process.env.DB_CONNECTION_LIMIT, 5, 10),
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4',
    timezone: 'Z',
  };
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DB_NAME && process.env.DB_USER);
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(databaseConfig());
  }
  return pool;
}

export async function pingDatabase() {
  if (!isDatabaseConfigured()) return false;
  const [rows] = await getPool().query('SELECT 1 AS ok');
  return rows?.[0]?.ok === 1;
}

export async function withTransaction(callback) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

export async function closePool() {
  if (!pool) return;
  const activePool = pool;
  pool = undefined;
  await activePool.end();
}

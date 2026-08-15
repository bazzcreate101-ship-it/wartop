import { getPool, withTransaction } from './db.js';

function parseJsonValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function uniqueKeys(keys) {
  return Array.from(new Set((Array.isArray(keys) ? keys : []).filter(Boolean)));
}

async function selectRows(connection, keys, { lock = false } = {}) {
  const selectedKeys = uniqueKeys(keys);
  if (selectedKeys.length === 0) return {};
  const placeholders = selectedKeys.map(() => '?').join(',');
  const [rows] = await connection.execute(
    `SELECT state_key, state_value, updated_at FROM app_state WHERE state_key IN (${placeholders})${lock ? ' FOR UPDATE' : ''}`,
    selectedKeys,
  );
  return rows.reduce((state, row) => {
    state[row.state_key] = parseJsonValue(row.state_value);
    return state;
  }, {});
}

async function upsertRows(connection, rows) {
  let written = 0;
  for (const row of rows) {
    if (!row?.key) continue;
    await connection.execute(
      `INSERT INTO app_state (state_key, state_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE state_value = VALUES(state_value), updated_at = CURRENT_TIMESTAMP(3)`,
      [row.key, JSON.stringify(row.value ?? null)],
    );
    written += 1;
  }
  return written;
}

export async function readStateRows(keys) {
  return selectRows(getPool(), keys);
}

export async function writeStateRows(rows) {
  return withTransaction((connection) => upsertRows(connection, rows));
}

export async function mutateStateRows(keys, updater) {
  return withTransaction(async (connection) => {
    const current = await selectRows(connection, keys, { lock: true });
    const rows = await updater(current);
    return upsertRows(connection, Array.isArray(rows) ? rows : []);
  });
}

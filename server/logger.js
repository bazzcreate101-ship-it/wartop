const SECRET_ENV_NAMES = [
  'DB_PASSWORD',
  'PREMZONE_API_KEY',
  'ADMIN_PASSWORD',
  'ADMIN_PASSWORD_HASH',
  'ADMIN_SESSION_SECRET',
  'USER_SESSION_SECRET',
  'TRAFFIC_HASH_SECRET',
  'GOOGLE_CLIENT_SECRET',
];

function redactSecrets(value) {
  let text = String(value || 'Unknown error').replace(/[\r\n\t]+/g, ' ').slice(0, 500);
  SECRET_ENV_NAMES.forEach((name) => {
    const secret = process.env[name];
    if (secret && secret.length >= 4) text = text.split(secret).join('[redacted]');
  });
  return text.replace(/(password|secret|token|api[_ -]?key)=?[^\s,;]*/gi, '$1=[redacted]');
}

export function logError({ endpoint = 'unknown', status = 500, category = 'server_error', error }) {
  const entry = {
    timestamp: new Date().toISOString(),
    endpoint: String(endpoint).slice(0, 160),
    status: Number(status) || 500,
    category: String(category).slice(0, 80),
    message: redactSecrets(error?.message || error),
  };
  console.error(JSON.stringify(entry));
}

export function logInfo({ endpoint = 'server', status = 200, category = 'info', message = '' }) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    endpoint: String(endpoint).slice(0, 160),
    status: Number(status) || 200,
    category: String(category).slice(0, 80),
    message: redactSecrets(message),
  }));
}

import logger from '../utils/logger.js';

const normalizeOrigin = (origin) => {
  if (!origin) return '';

  const normalized = origin.trim().replace(/\/+$/, '');
  if (!normalized) return '';

  try {
    const url = new URL(normalized.includes('://') ? normalized : `https://${normalized}`);
    return `${url.protocol}//${url.host}`;
  } catch {
    return normalized.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  }
};

const parseConfiguredOrigins = (value) => {
  if (!value) return [];

  return value
    .split(/(?:\s*[,;\r\n]\s*|\s*:\s*(?=https?:\/\/))/)
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
};

const CorsMiddleware = (req, res, next) => {
  const requestOrigin = req.headers.origin;
  const configuredOrigins = parseConfiguredOrigins(process.env.FRONTEND_ORIGINS || '');

  const staticProductionOrigins = process.env.NODE_ENV === 'production'
    ? ['https://sahas.coop.np']
    : [];

  const developmentOrigins = process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];

  const allowedOrigins = new Set([
    ...configuredOrigins,
    ...staticProductionOrigins.map((origin) => normalizeOrigin(origin)),
    ...developmentOrigins.map((origin) => normalizeOrigin(origin)),
  ]);

  const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
  const originAllowed = !requestOrigin || allowedOrigins.has(normalizedRequestOrigin);

  if (!originAllowed) {
    logger.warn('CORS origin rejected', { origin: requestOrigin, path: req.originalUrl });
    return res.status(403).json({ message: 'Origin is not allowed' });
  }

  if (requestOrigin) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
};

export default CorsMiddleware;
import logger from '../utils/logger.js';

const CorsMiddleware = (req, res, next) => {
  const requestOrigin = req.headers.origin;
  const configuredOrigins = (process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const originAllowed = !requestOrigin || configuredOrigins.includes(requestOrigin);

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
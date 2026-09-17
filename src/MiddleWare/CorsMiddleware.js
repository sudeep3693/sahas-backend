import logger from '../utils/logger.js';

const CorsMiddleware = (req, res, next) => {
  const requestOrigin = req.headers.origin;

  // Accept all origins in both local development and production.
  // This avoids false 403s caused by mismatched env parsing or hosted-domain formatting.
  const allowedOrigin = requestOrigin || '*';

  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id, Accept, Accept-Language, Origin, Referer, Sec-Fetch-Mode, Sec-Fetch-Site, Sec-Fetch-Dest, User-Agent');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.header('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    logger.info('CORS preflight handled', { origin: requestOrigin, path: req.originalUrl });
    return res.sendStatus(204);
  }

  next();
};

export default CorsMiddleware;
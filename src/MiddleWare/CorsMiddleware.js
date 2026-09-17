const getAllowedOrigins = () => (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const CorsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (origin) {
    const isAllowed = allowedOrigins.includes(origin);

    if (!isAllowed) {
      console.warn('CORS origin rejected', { origin, path: req.path });
      return res.status(403).json({ message: 'Origin is not allowed' });
    }

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Request-Id');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
};

export default CorsMiddleware;
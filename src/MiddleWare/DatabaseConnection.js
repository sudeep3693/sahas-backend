import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const DBConnect = (req, res, next) => {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return next();
  }

  const requestId = req.requestId || 'unknown';
  logger.error('Database unavailable for request', { requestId, path: req.originalUrl, readyState: mongoose.connection.readyState });
  return res.status(503).json({
    message: 'Database service temporarily unavailable',
    requestId,
  });
};

export default DBConnect;

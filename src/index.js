import express from 'express';
import dns from 'dns';
import crypto from 'crypto';
import logger from './utils/logger.js';

// Fix local router DNS SRV lookup issues (querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore error if environment restricts changing DNS servers
}

import mongoose from 'mongoose';
import LoginRoute from './Routes/LoginRoute.js';
import CorsMiddleware from './MiddleWare/CorsMiddleware.js';
import CarouselImageRoute from './Routes/CarouselImageRoute.js';
import FinancialRoute from './Routes/FinancialRoute.js';
import NoticeRoute from './Routes/NoticeRoute.js';
import GalleryRoute from './Routes/GalleryRoute.js';
import TeamDetailRoute from './Routes/TeamDetailsRoute.js';
import BasicDetails from './Routes/BasicDetails.js';
import NewsRoute from './Routes/NewsRoute.js';
import DocumentRoute from './Routes/DocumentRoute.js';
import MessageRoute from './Routes/MessageRoute.js';
import ForgetPassword from './Routes/ForgetPassword.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});
app.use(CorsMiddleware);
app.use(logger.requestMiddleware);

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API routes
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Sahas Cooperative Backend API is running successfully' });
});

app.get('/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'degraded',
    database: databaseReady ? 'connected' : 'disconnected',
  });
});

app.use('/admin', LoginRoute);
app.use('/images', CarouselImageRoute);
app.use('/financial', FinancialRoute);
app.use('/notice', NoticeRoute);
app.use('/gallery', GalleryRoute);
app.use('/api', BasicDetails);
app.use('/teamDetail', TeamDetailRoute);
app.use('/news', NewsRoute);
app.use('/documents', DocumentRoute);
app.use('/messages', MessageRoute);
app.use('/credential', ForgetPassword);

// Serve PDFs (local storage)
app.use('/pdf', express.static(path.join(__dirname, '..', 'pdf')));

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.use((error, req, res, next) => {
  logger.error('Unhandled request error', { requestId: req.requestId, error });
  if (res.headersSent) return next(error);

  const statusCode = Number.isInteger(error.statusCode) && error.statusCode >= 400
    ? error.statusCode
    : 500;
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : error.message || 'Request failed';
  res.status(statusCode).json({ message, requestId: req.requestId });
});

const startServer = async () => {
  if (!MONGO_URI) throw new Error('MONGO_URI is not configured');

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
  });
  logger.info('MongoDB connected successfully');

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Log directory: ${process.cwd()}/logs (writing YYYY-MM-DD.log)`);
  });
};

startServer().catch((error) => {
  logger.error('Backend startup failed', error);
  process.exitCode = 1;
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

export default app;

/**
 * logger.js
 * Simple file-based logger. Writes timestamped logs to logs/app.log
 * This file is visible on the server via cPanel File Manager under
 * repositories/sahas-backend/logs/app.log
 *
 * Uses only Node.js built-ins — no extra npm dependencies needed.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// logs/ directory lives at sahas-backend/logs/
const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Create logs directory if it does not exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/** Returns a human-readable timestamp: YYYY-MM-DD HH:MM:SS */
function timestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Core write — appends one line to app.log and echoes to stdout/stderr.
 * @param {'INFO '|'WARN '|'ERROR'} level
 * @param {string} message
 * @param {Error|object|string|undefined} extra
 */
function write(level, message, extra) {
  let line = `[${timestamp()}] [${level}] ${message}`;

  if (extra !== undefined && extra !== null) {
    if (extra instanceof Error) {
      line += ` | ${extra.message}`;
      if (extra.stack) line += `\n  Stack: ${extra.stack}`;
    } else if (typeof extra === 'object') {
      try {
        line += ` | ${JSON.stringify(extra)}`;
      } catch {
        line += ` | [unserializable object]`;
      }
    } else {
      line += ` | ${extra}`;
    }
  }

  const fullLine = line + '\n';

  // Async append — will not crash the server on failure
  fs.appendFile(LOG_FILE, fullLine, (err) => {
    if (err) process.stderr.write(`[LOGGER] Cannot write to log file: ${err.message}\n`);
  });

  // Mirror to terminal as well
  if (level === 'ERROR') {
    process.stderr.write(fullLine);
  } else {
    process.stdout.write(fullLine);
  }
}

const logger = {
  /** Log an informational message. */
  info(message, extra) { write('INFO ', message, extra); },

  /** Log a warning. */
  warn(message, extra) { write('WARN ', message, extra); },

  /** Log an error. */
  error(message, extra) { write('ERROR', message, extra); },

  /**
   * Express middleware — logs every HTTP request with method, path,
   * status code, response time, and client IP.
   * Usage: app.use(logger.requestMiddleware);
   */
  requestMiddleware(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const lvl = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN ' : 'INFO ';
      write(lvl, `${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms) [${req.ip || req.socket?.remoteAddress || 'unknown'}]`);
    });
    next();
  },
};

export default logger;

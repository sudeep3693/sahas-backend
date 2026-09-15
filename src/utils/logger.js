/**
 * logger.js
 * Date-based file logger. Creates one log file per day:
 *   logs/2026-09-15.log
 *   logs/2026-09-16.log  (new file automatically at midnight)
 *
 * Visible on the server via cPanel File Manager at:
 *   repositories/sahas-backend/logs/YYYY-MM-DD.log
 *
 * Uses only Node.js built-ins — no extra npm dependencies needed.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve logs/ relative to the project root (sahas-backend/logs/)
// __dirname = sahas-backend/src/utils → go up 2 levels
// Falls back to process.cwd() in case __dirname resolves unexpectedly on the server
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const LOG_DIR = path.join(PROJECT_ROOT, 'logs');
const FALLBACK_LOG_FILE = path.join(LOG_DIR, 'app.log');

// Create logs directory if it does not exist
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (e) {
  process.stderr.write(`[LOGGER] Failed to create log directory at ${LOG_DIR}: ${e.message}\n`);
}


/**
 * Returns today's date string in YYYY-MM-DD format (local time).
 * This is used as the log file name so a new file is created each day.
 */
function todayDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns the full path to today's log file, e.g. logs/2026-09-15.log
 * Called fresh on every write so the date rolls over at midnight automatically.
 */
function todayLogFile() {
  return path.join(LOG_DIR, `${todayDate()}.log`);
}

/** Returns a full timestamp string: YYYY-MM-DD HH:MM:SS */
function timestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const hh   = String(now.getHours()).padStart(2, '0');
  const min  = String(now.getMinutes()).padStart(2, '0');
  const sec  = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
}

/**
 * Core write — appends one line to today's date log file and echoes to stdout/stderr.
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

  // Append to today's log file (async — will not crash the server on failure)
  const appendLog = (filePath) => fs.appendFile(filePath, fullLine, (err) => {
    if (err) process.stderr.write(`[LOGGER] Cannot write to log file ${filePath}: ${err.message}\n`);
  });
  appendLog(todayLogFile());
  appendLog(FALLBACK_LOG_FILE);

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
      const ms  = Date.now() - start;
      const lvl = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN ' : 'INFO ';
      write(lvl, `${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms) [${req.ip || req.socket?.remoteAddress || 'unknown'}]`);
    });
    next();
  },
};

export default logger;

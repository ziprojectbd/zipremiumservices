import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logDir = path.resolve(__dirname, '../../logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format with colorize for console
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const reqId = requestId ? ` [${requestId}]` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}${reqId}: ${message}${metaStr}`;
  }),
);

// JSON format for file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'zi-premium-services' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Error log with daily rotation
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: true,
    }),
    // Combined log with daily rotation
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxFiles: '14d',
      maxSize: '50m',
      zippedArchive: true,
    }),
  ],
});

// Access log (separate instance for Morgan integration)
export const accessLogger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'access' },
  transports: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxFiles: '14d',
      maxSize: '50m',
      zippedArchive: true,
    }),
    // Also log access to console in dev
    ...(process.env.NODE_ENV !== 'production'
      ? [new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message }) =>
              `${timestamp} ${level}: ${message}`,
            ),
          ),
        })]
      : []),
  ],
});

// Stream for Morgan
export const morganStream = {
  write: (message: string) => {
    accessLogger.info(message.trim());
  },
};

// Auth event logger
export function logAuthEvent(
  event: string,
  details: Record<string, unknown>,
): void {
  logger.info(`AUTH: ${event}`, { eventType: 'auth', ...details });
}

// Payment event logger
export function logPaymentEvent(
  event: string,
  details: Record<string, unknown>,
): void {
  logger.info(`PAYMENT: ${event}`, { eventType: 'payment', ...details });
}

// Critical system error logger
export function logCriticalError(
  message: string,
  error: unknown,
): void {
  logger.error(`CRITICAL: ${message}`, {
    eventType: 'critical',
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error,
  });
}

export default logger;

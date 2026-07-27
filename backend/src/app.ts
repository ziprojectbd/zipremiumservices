import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import hpp from 'hpp';
import { errorHandler } from '@middlewares/errorHandler';
import routes from '@routes/index.js';
import env from '@config/env';
import { morganStream } from '@config/logger';
import { requestIdMiddleware, responseTimeMiddleware } from '@middlewares/requestId';
import { globalRateLimit, globalSlowDown } from '@middlewares/rateLimiter';
import { sanitize, xssClean } from '@middlewares/sanitizer';
import { requestTimeout } from '@middlewares/timeout';
import { metricsMiddleware, getMetrics } from '@middlewares/metrics';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@docs/swagger';
import mongoose from 'mongoose';

const app = express();

// Trust proxy — required for accurate rate limiting behind nginx/Cloudflare
app.set('trust proxy', 1);

// =========================================================================
// Global Middleware (order matters for performance & safety)
// =========================================================================

// 1. Request ID and timing — must be first
app.use(requestIdMiddleware);
app.use(responseTimeMiddleware);

// 2. Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
}));

// 3. CORS
const origins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = [
  env.CLIENT_URL,
  ...origins,
  ...(env.NODE_ENV !== 'production'
    ? ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173']
    : []),
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Be permissive in dev
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-Response-Time'],
}));

// 4. Request logging (morgan)
app.use(morgan('combined', { stream: morganStream }));

// 5. Compression
app.use(compression({
  level: env.COMPRESSION_LEVEL,
  threshold: 1024, // minimum size in bytes to compress
}));

// 6. Cookie parser
app.use(cookieParser());

// 7. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 8. Security sanitizers
app.use(sanitize);
app.use(xssClean);

// 9. HTTP parameter pollution protection
app.use(hpp({
  whitelist: ['page', 'limit', 'sort', 'order', 'search', 'category', 'status'],
}));

// 10. Rate limiting & slow-down
app.use(globalSlowDown);
app.use(globalRateLimit);

// 11. Request timeout
app.use(requestTimeout);

// 12. Prometheus metrics
app.use(metricsMiddleware);

// =========================================================================
// Routes
// =========================================================================

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ZI Premium Services API Docs',
}));

// Raw Swagger JSON
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// Metrics endpoint
app.get('/metrics', getMetrics);

// API routes (versioned)
app.use('/api/v1', routes);
app.use('/api', routes); // backward-compatible unversioned alias

// Health check endpoints
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: '1.0.0',
  });
});

app.get('/health/live', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health/ready', async (_req, res) => {
  const checks: Record<string, unknown> = {
    server: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  // Check MongoDB connection
  const mongoState = mongoose.connection.readyState;
  checks.mongodb = mongoState === 1;
  if (mongoState !== 1) {
    checks.mongodbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoState] || 'unknown';
  }

  const allOk = Object.values(checks).every((v) => v === true);
  const status = allOk ? 200 : 503;

  res.status(status).json({
    success: allOk,
    message: allOk ? 'Server is ready' : 'Some dependencies are unavailable',
    data: checks,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: {},
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;

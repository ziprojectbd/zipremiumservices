import promClient from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'zi_',
});

// Custom metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'zi_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const httpRequestsTotal = new promClient.Counter({
  name: 'zi_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeConnections = new promClient.Gauge({
  name: 'zi_active_connections',
  help: 'Number of active connections',
  registers: [register],
});

export const dbQueryDuration = new promClient.Histogram({
  name: 'zi_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

export const errorCounter = new promClient.Counter({
  name: 'zi_errors_total',
  help: 'Total number of errors by type',
  labelNames: ['type', 'route'],
  registers: [register],
});

export const authEvents = new promClient.Counter({
  name: 'zi_auth_events_total',
  help: 'Total number of authentication events',
  labelNames: ['event', 'status'],
  registers: [register],
});

// Metrics middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.originalUrl || 'unknown';

    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode.toString() }, duration);
    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode.toString() });
    activeConnections.dec();

    if (res.statusCode >= 400) {
      errorCounter.inc({ type: res.statusCode >= 500 ? 'server' : 'client', route });
    }
  });

  next();
}

// Metrics endpoint handler
export async function getMetrics(_req: Request, res: Response): Promise<void> {
  try {
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to collect metrics',
      error: {},
    });
  }
}

export { register };

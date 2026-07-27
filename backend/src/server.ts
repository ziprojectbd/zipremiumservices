import app from './app.js';
import connectDB from '@db/connect';
import env from '@config/env';
import logger, { logCriticalError } from '@config/logger';
import { validateEnv } from '@config/env';
import { closeRedis } from '@config/redis';
import mongoose from 'mongoose';

let server: ReturnType<typeof app.listen> | null = null;

async function start(): Promise<void> {
  try {
    // Validate environment variables
    validateEnv();
    logger.info('Environment variables validated');

    // Connect to MongoDB
    await connectDB();
    logger.info('MongoDB connected');

    // Start server
    server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`Health check: http://localhost:${env.PORT}/health`);
      logger.info(`API Docs: http://localhost:${env.PORT}/api-docs`);
      logger.info(`Metrics: http://localhost:${env.PORT}/metrics`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logCriticalError(`Port ${env.PORT} is already in use`, error);
        process.exit(1);
      } else {
        logCriticalError('Server error', error);
        process.exit(1);
      }
    });

  } catch (err) {
    logCriticalError('Failed to start server', err);
    process.exit(1);
  }
}

// =========================================================================
// Graceful Shutdown Handler
// =========================================================================
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new requests
  if (server) {
    await new Promise<void>((resolve) => {
      server!.close((err) => {
        if (err) {
          logger.error('Error closing HTTP server', { error: err.message });
        } else {
          logger.info('HTTP server closed');
        }
        resolve();
      });
    });
  }

  // Close MongoDB connection
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.error('Error closing MongoDB connection', { error: err instanceof Error ? err.message : String(err) });
  }

  // Close Redis connection if enabled
  try {
    await closeRedis();
  } catch (err) {
    logger.error('Error closing Redis connection', { error: err instanceof Error ? err.message : String(err) });
  }

  logger.info('Graceful shutdown complete');
  process.exit(0);
}

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logCriticalError('Uncaught exception', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logCriticalError('Unhandled promise rejection', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

start();

// Export for testing
export { app, server };

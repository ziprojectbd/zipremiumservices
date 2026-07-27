import mongoose from 'mongoose';
import env from '@config/env';
import logger from '@config/logger';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

async function connectWithRetry(attempt: number = 1): Promise<typeof mongoose> {
  try {
    if (!env.MONGODB_URI) {
      throw new Error('Please define MONGODB_URI in backend/.env');
    }

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
      const mongooseOptions: mongoose.ConnectOptions = {
        bufferCommands: false,
        tls: true,
        serverSelectionTimeoutMS: 10000,
        heartbeatFrequencyMS: 30000,
        socketTimeoutMS: 45000,
      };

      // ⚠️ Only allow invalid certs in development — never in production
      if (env.NODE_ENV !== 'production') {
        mongooseOptions.tlsAllowInvalidCertificates = true;
      }

      cached.promise = mongoose.connect(env.MONGODB_URI, mongooseOptions);
    }

    cached.conn = await cached.promise;
    logger.info('MongoDB connected successfully');
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Reset so next call retries

    if (attempt < MAX_RETRIES) {
      logger.warn(`MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY_MS / 1000}s...`, {
        error: error instanceof Error ? error.message : String(error),
      });
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectWithRetry(attempt + 1);
    }

    logger.error('MongoDB connection failed after max retries', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Event listeners
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { error: err.message });
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

export default async function connectDB(): Promise<typeof mongoose> {
  return connectWithRetry();
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const state = mongoose.connection.readyState;
    if (state !== 1) return false;

    // Run a lightweight ping
    await mongoose.connection.db?.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

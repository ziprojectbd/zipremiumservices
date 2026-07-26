import mongoose from 'mongoose';
import env from '../config/env.js';

/** @type {{ conn: typeof mongoose | null, promise: Promise<typeof mongoose> | null }} */
const cached = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export default async function connectDB() {
  if (!env.MONGODB_URI) {
    throw new Error('Please define MONGODB_URI in backend/.env');
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const mongooseOptions = {
      bufferCommands: false,
      tls: true,
    };

    // ⚠️ Only allow invalid certs in development — never in production
    if (env.NODE_ENV !== 'production') {
      mongooseOptions.tlsAllowInvalidCertificates = true;
    }

    cached.promise = mongoose.connect(env.MONGODB_URI, mongooseOptions);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

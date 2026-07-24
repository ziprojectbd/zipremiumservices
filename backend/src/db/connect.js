import mongoose from 'mongoose';
import env from '../config/env.js';

if (!env.MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in backend/.env');
}

/** @type {{ conn: typeof mongoose | null, promise: Promise<typeof mongoose> | null }} */
const cached = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false,
      tls: true,
      tlsAllowInvalidCertificates: true,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

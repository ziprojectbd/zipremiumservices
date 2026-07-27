import slowDown from 'express-slow-down';
import rateLimit from 'express-rate-limit';
import env from '@config/env';

// Global speed limiter — gradually slows down responses after threshold
export const globalSlowDown = slowDown({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  delayAfter: Math.floor(env.RATE_LIMIT_MAX * 0.7), // start slowing at 70% of limit
  delayMs: (hits) => hits * 100, // add 100ms per hit over threshold
  maxDelayMs: 5000,
  message: { success: false as const, error: 'Too many requests, please slow down' },
});

// Strict rate limiter for API globally
export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false as const, error: 'Too many requests, please try again later' },
});

export const strict = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false as const, error: 'Too many requests, please try again later' },
});

export const standard = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false as const, error: 'Too many requests, please try again later' },
});

export const auth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false as const, error: 'Too many login attempts, please try again later' },
});

export const lenient = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false as const, error: 'Too many requests, please try again later' },
});

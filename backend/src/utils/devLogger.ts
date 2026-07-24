/**
 * Production-safe logging utility
 * All logging is disabled in production to prevent log pollution and info leakage
 */

// Check at module load — statically evaluable, enables tree-shaking dead code elimination
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Silent logger - does nothing, for completely removing debug code
 */
export const silent = Object.assign(
  () => {},
  { warn: () => {}, error: () => {}, info: () => {}, debug: () => {} }
);

/**
 * Dev logger - logs only in development
 */
const _log = IS_DEV ? console.log.bind(console) : silent;
const _warn = IS_DEV ? console.warn.bind(console) : silent;
const _error = IS_DEV ? console.error.bind(console) : silent;

export function devLog(...args: unknown[]) {
  _log(...args);
}

export function devWarn(...args: unknown[]) {
  _warn(...args);
}

export function devError(...args: unknown[]) {
  _error(...args);
}
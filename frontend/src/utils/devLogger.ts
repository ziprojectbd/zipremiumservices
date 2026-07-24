const IS_DEV = import.meta.env.DEV;

export const silent = Object.assign(
  () => {},
  { warn: () => {}, error: () => {}, info: () => {}, debug: () => {} }
);

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

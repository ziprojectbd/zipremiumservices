/**
 * Production-safe logging utility
 * All logging is disabled in production to prevent log pollution and info leakage
 */
/**
 * Silent logger - does nothing, for completely removing debug code
 */
export declare const silent: (() => void) & {
    warn: () => void;
    error: () => void;
    info: () => void;
    debug: () => void;
};
export declare function devLog(...args: unknown[]): void;
export declare function devWarn(...args: unknown[]): void;
export declare function devError(...args: unknown[]): void;
//# sourceMappingURL=devLogger.d.ts.map
/**
 * Extract the real client IP from a request.
 */
export declare function getClientIP(req: any): string;
/**
 * Look up country info from an IP address using the free ip-api.com service.
 * Results are cached in memory to stay within rate limits (45 req/min).
 */
export declare function getGeoFromIP(ip: string): Promise<{
    country: string;
    countryCode: string;
}>;
/**
 * Convert a 2-letter country code to a flag emoji.
 * E.g. 'BD' → '🇧🇩', 'US' → '🇺🇸'
 */
export declare function countryCodeToFlag(countryCode: string): string;
//# sourceMappingURL=geo.d.ts.map
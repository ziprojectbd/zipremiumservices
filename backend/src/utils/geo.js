import { devLog } from './devLogger';
// In-memory cache for IP lookups to avoid hitting the API on every request
const geoCache = new Map();
/**
 * Extract the real client IP from a request.
 */
export function getClientIP(req) {
    // Helper to read headers from either Express req (object) or Web API Request (.get())
    const getHeader = (name) => {
        if (typeof req.headers?.get === 'function') {
            return req.headers.get(name) || undefined;
        }
        return req.headers?.[name.toLowerCase()];
    };
    // 1. Client-side provided IP (most reliable — sent from browser)
    const clientIp = getHeader('x-client-ip');
    if (clientIp && clientIp !== 'unknown')
        return clientIp;
    // 2. Standard proxy headers
    const forwarded = getHeader('x-forwarded-for');
    if (forwarded) {
        const ip = forwarded.split(',')[0].trim();
        if (ip && ip !== 'unknown')
            return ip;
    }
    // 3. Cloudflare
    const cfIp = getHeader('cf-connecting-ip');
    if (cfIp)
        return cfIp;
    // 4. Nginx / others
    const realIp = getHeader('x-real-ip');
    if (realIp)
        return realIp;
    // 5. Vercel-specific headers
    const vercelIp = getHeader('x-vercel-forwarded-for');
    if (vercelIp)
        return vercelIp;
    // 6. Express req.ip / req.socket.remoteAddress
    if (req.ip)
        return req.ip;
    try {
        if (req.socket?.remoteAddress)
            return req.socket.remoteAddress;
    }
    catch {
        // ignore
    }
    return '';
}
/**
 * Look up country info from an IP address using the free ip-api.com service.
 * Results are cached in memory to stay within rate limits (45 req/min).
 */
export async function getGeoFromIP(ip) {
    if (!ip || ['127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1'].includes(ip)) {
        return { country: 'Local', countryCode: '' };
    }
    const cached = geoCache.get(ip);
    if (cached)
        return cached;
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode`, {
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) {
            devLog('Geo lookup returned non-ok status:', res.status);
            return { country: 'Unknown', countryCode: '' };
        }
        const data = await res.json();
        if (data && data.countryCode) {
            const result = { country: data.country || '', countryCode: data.countryCode };
            geoCache.set(ip, result);
            return result;
        }
    }
    catch (err) {
        devLog('Geo lookup failed for IP:', ip, err);
    }
    return { country: 'Unknown', countryCode: '' };
}
/**
 * Convert a 2-letter country code to a flag emoji.
 * E.g. 'BD' → '🇧🇩', 'US' → '🇺🇸'
 */
export function countryCodeToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2)
        return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
//# sourceMappingURL=geo.js.map
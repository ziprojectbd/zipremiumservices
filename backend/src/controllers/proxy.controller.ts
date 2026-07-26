import axios from 'axios';

// Simple in-memory cache: url -> { buffer, contentType }
const cache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Periodic cache cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.timestamp > CACHE_TTL) cache.delete(key);
  }
}, 60 * 60 * 1000); // every hour

// GET /api/proxy/image?url=...
export async function proxyImage(req: import('express').Request, res: import('express').Response) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Only allow proxying specific trusted domains
  const allowedHosts = ['lh3.googleusercontent.com', 'lh4.googleusercontent.com', 'lh5.googleusercontent.com', 'lh6.googleusercontent.com'];
  try {
    const parsed = new URL(url as string);
    if (!allowedHosts.includes(parsed.hostname)) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Check cache
  const cached = cache.get(url as string);
  if (cached) {
    res.set('Content-Type', cached.contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('X-Cache', 'HIT');
    return res.send(cached.buffer);
  }

  try {
    const response = await axios.get(url as string, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'image/*',
      },
    });

    const contentType = (response.headers['content-type'] as string) || 'image/jpeg';
    const buffer = Buffer.from(response.data as ArrayBuffer);

    // Store in cache
    cache.set(url as string, { buffer, contentType, timestamp: Date.now() });

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('X-Cache', 'MISS');
    res.send(buffer);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch image' });
  }
}

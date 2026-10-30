/**
 * Get the client's public IP from a third-party service.
 * Caches the result so we only call it once per session.
 */
let cachedIp: string | null = null;

export async function getPublicIP(): Promise<string> {
  if (cachedIp) return cachedIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    cachedIp = data.ip || '';
    return cachedIp as string;
  } catch {
    return '';
  }
}

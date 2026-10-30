/**
 * Google Drive download helpers for purchased-file delivery.
 *
 * Kept separate from the controller so the streaming path can be exercised
 * against a stub server in tests.
 */

/** Pull the file id out of every Google Drive URL shape we accept. */
export function extractGoogleDriveFileId(url: string): string {
  const patterns = [
    /\/file\/d\/([A-Za-z0-9_-]{10,})/, // /file/d/<id>/view
    /[?&]id=([A-Za-z0-9_-]{10,})/, // ?id=<id>
    /\/d\/([A-Za-z0-9_-]{10,})/, // /d/<id>
  ];
  for (const re of patterns) {
    const match = re.exec(String(url || ''));
    if (match?.[1]) return match[1];
  }
  return '';
}

/** Content-Disposition with a safe, RFC 5987-encoded filename. */
export function attachmentHeader(filename: string): string {
  const clean = String(filename || 'download').replace(/[\r\n]/g, '').trim() || 'download';
  const fallback = clean.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '');
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(clean)}`;
}

export interface DriveFileResponse {
  ok: boolean;
  /** True when Drive returned an HTML page (private file, or a confirm step). */
  isHtml: boolean;
  /** True when that HTML page is Google's sign-in / request-access gate. */
  needsAccess: boolean;
  status: number;
  contentType: string;
  filename: string;
  contentLength: string | null;
  stream: ReadableStream<Uint8Array> | null;
  /** Present only for HTML responses so the caller can inspect the reason. */
  html: string;
}

const DEFAULT_HOST = 'https://drive.usercontent.google.com';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36';

/**
 * Fetch a Drive file as a stream.
 *
 * `confirm=t` skips Drive's virus-scan interstitial for most files. When Drive
 * still answers with HTML the caller decides what to do (a private file needs a
 * clear message, not an HTML page saved as the download).
 *
 * `host` is only overridden by tests.
 */
export async function fetchDriveFile(
  fileId: string,
  fallbackName = 'download',
  host: string = DEFAULT_HOST,
): Promise<DriveFileResponse> {
  const url = `${host}/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': BROWSER_UA, Accept: '*/*' },
  });

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('text/html')) {
    const html = await res.text();
    return {
      ok: false,
      isHtml: true,
      needsAccess: /accounts\.google\.com|sign in|request access|you need access/i.test(html),
      status: res.status,
      contentType,
      filename: fallbackName,
      contentLength: null,
      stream: null,
      html,
    };
  }

  // Prefer the name Drive reports, otherwise fall back to the product name.
  const disposition = res.headers.get('content-disposition') || '';
  const matched = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)?.[1];
  let filename = fallbackName;
  if (matched) {
    try {
      filename = decodeURIComponent(matched);
    } catch {
      filename = matched;
    }
  }

  return {
    ok: res.ok,
    isHtml: false,
    needsAccess: false,
    status: res.status,
    contentType: contentType || 'application/octet-stream',
    filename,
    contentLength: res.headers.get('content-length'),
    stream: (res.body as ReadableStream<Uint8Array> | null) ?? null,
    html: '',
  };
}

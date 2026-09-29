import { Chrome, Download, ExternalLink, FileDown } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import type { ReactElement } from 'react';

export interface DeliveryLinkCardProps {
  /** Destination the customer should open. Empty renders nothing. */
  link?: string | null;
  /** Button text. Falls back to "Add to Chrome" for extension links. */
  label?: string | null;
  /** Optional guidance shown above the button. */
  message?: string | null;
  /** Rendered inside the card, above the message (e.g. an API key block). */
  children?: ReactNode;
  className?: string;
  /**
   * Order this delivery belongs to. Required for file deliveries: the download
   * is streamed through our own origin (`/orders/:id/delivery-download`) so the
   * browser saves the file instead of opening the host's preview page.
   */
  orderId?: string | null;
  /**
   * Start the download as soon as the card appears. Browsers only allow this
   * once per user gesture, so the button stays as the reliable path and the
   * attempt is remembered per order to avoid looping on refresh.
   */
  autoDownload?: boolean;
}

/** Chrome Web Store install pages get browser-specific wording/icon. */
function isChromeStoreLink(url: string): boolean {
  return /chromewebstore\.google\.com|chrome\.google\.com\/webstore/i.test(url);
}

/** Installers and archives are delivered as downloads rather than opened. */
function isDownloadableFile(url: string): boolean {
  return /\.(exe|msi|dmg|pkg|apk|crx|zip|rar|7z|tar|gz|pdf)(\?|#|$)/i.test(url);
}

/** Google Drive links (a view page or a direct link) are delivered by download. */
export function isGoogleDriveLink(url: string): boolean {
  return /drive\.google\.com|drive\.usercontent\.google\.com/i.test(url);
}

/**
 * Delivery instructions shown to a customer after their order is fulfilled.
 *
 * Used for products whose delivery is a download/install step (a browser
 * extension or a downloadable tool) rather than an API key. File downloads go
 * through our own origin so the browser saves them with a proper filename; all
 * other links open in a new tab with `noopener noreferrer`.
 */
export default function DeliveryLinkCard({
  link,
  label,
  message,
  children,
  className = '',
  orderId,
  autoDownload = false,
}: DeliveryLinkCardProps): ReactElement | null {
  const url = String(link || '').trim();
  const attempted = useRef(false);

  const isDrive = isGoogleDriveLink(url);
  const canProxyDownload = isDrive && Boolean(orderId);

  // Same-origin streaming endpoint; Content-Disposition names the file.
  const downloadUrl = canProxyDownload
    ? `/api/orders/${encodeURIComponent(String(orderId))}/delivery-download`
    : url;

  useEffect(() => {
    if (!autoDownload || !canProxyDownload || attempted.current) return;

    // One attempt per order, so a refresh does not start it again.
    const key = `zi-delivery-downloaded:${orderId}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch {
      // Private mode — fall through and try anyway.
    }

    attempted.current = true;

    // A synthetic same-origin navigation triggers the download without leaving
    // the page. Browsers may still require the button, which is always shown.
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.src = downloadUrl;
    document.body.appendChild(frame);
    window.setTimeout(() => frame.remove(), 60_000);
  }, [autoDownload, canProxyDownload, downloadUrl, orderId]);

  // Nothing to deliver — render nothing.
  if (!url) return null;

  const isFileDelivery = canProxyDownload || isDownloadableFile(url);
  const chromeStore = isChromeStoreLink(url) && !canProxyDownload;
  const defaultLabel = chromeStore
    ? 'Add to Chrome'
    : isFileDelivery
      ? 'Download Now'
      : 'Open Link';
  const buttonLabel = String(label || '').trim() || defaultLabel;
  const trimmedMessage = String(message || '').trim();

  const Icon = chromeStore ? Chrome : isFileDelivery ? FileDown : ExternalLink;

  return (
    <div
      className={`rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-3 sm:p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <h4 className="font-semibold text-white text-sm sm:text-base">Your Delivery</h4>
      </div>

      {trimmedMessage && (
        <p className="text-gray-200 text-xs sm:text-sm whitespace-pre-wrap mb-3 leading-relaxed">
          {trimmedMessage}
        </p>
      )}

      {children}

      <a
        href={downloadUrl}
        // A proxied download is same-origin, so the browser honours the
        // `download` attribute; external links open in a new tab instead.
        {...(canProxyDownload
          ? { download: '' }
          : { target: '_blank', rel: 'noopener noreferrer' })}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all active:scale-[0.98]"
      >
        <Icon className="w-4 h-4" />
        {buttonLabel}
        {isFileDelivery ? (
          <Download className="w-3.5 h-3.5 opacity-70" />
        ) : (
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        )}
      </a>

      {canProxyDownload && (
        <p className="mt-2 text-[11px] text-gray-400">
          Your download should start automatically. If it doesn&apos;t, tap the button above.
        </p>
      )}
    </div>
  );
}

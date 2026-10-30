import { Chrome, Download, ExternalLink, FileDown } from 'lucide-react';
import { useEffect, useMemo, useRef, type ReactNode, type ReactElement } from 'react';

export interface DeliveryLinkCardProps {
  /** Primary destination, e.g. the downloadable tool. Empty renders nothing. */
  link?: string | null;
  /** Button text for the primary action. */
  label?: string | null;
  /** Optional second action, e.g. the Chrome extension. */
  link2?: string | null;
  /** Button text for the second action. */
  label2?: string | null;
  /** Optional guidance shown above the buttons. */
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
   * Start the file download as soon as the card appears. Browsers only allow
   * this once per user gesture, so the buttons stay as the reliable path and the
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

interface Action {
  href: string;
  label: string;
  icon: typeof Chrome;
  /** Same-origin proxied download — the browser names and saves the file. */
  isProxyDownload: boolean;
  isChromeStore: boolean;
  isFile: boolean;
}

/**
 * Delivery actions shown to a customer after their order is fulfilled.
 *
 * Products fulfilled by a download/install step (a downloadable tool, a browser
 * extension) rather than an API key. A product may expose two actions — the tool
 * and its companion extension — which are rendered as one horizontal row on
 * desktop and stacked on small screens so nothing overflows.
 *
 * File downloads are streamed through our own origin so the browser saves them
 * with a real filename; every other link opens in a new tab with
 * `noopener noreferrer`.
 */
export default function DeliveryLinkCard({
  link,
  label,
  link2,
  label2,
  message,
  children,
  className = '',
  orderId,
  autoDownload = false,
}: DeliveryLinkCardProps): ReactElement | null {
  const attempted = useRef(false);

  const buildAction = (
    rawUrl: string | null | undefined,
    rawLabel: string | null | undefined,
    allowAutoDownload: boolean,
  ): Action | null => {
    const url = String(rawUrl || '').trim();
    if (!url) return null;

    const chromeStore = isChromeStoreLink(url);
    // Only the Drive-backed first action is proxied for a named download.
    const proxy = allowAutoDownload && isGoogleDriveLink(url) && Boolean(orderId);
    const file = proxy || isDownloadableFile(url);

    const defaultLabel = chromeStore ? 'Add to Chrome' : file ? 'Download Now' : 'Open Link';
    const text = String(rawLabel || '').trim() || defaultLabel;

    const href = proxy ? `/api/orders/${encodeURIComponent(String(orderId))}/delivery-download` : url;

    return {
      href,
      label: text,
      icon: chromeStore ? Chrome : file ? FileDown : ExternalLink,
      isProxyDownload: proxy,
      isChromeStore: chromeStore,
      isFile: file,
    };
  };

  const actions = useMemo(() => {
    const list: Action[] = [];
    const first = buildAction(link, label, true);
    if (first) list.push(first);
    const second = buildAction(link2, label2, false);
    if (second) list.push(second);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link, label, link2, label2, orderId]);

  const primaryProxyDownload = actions[0]?.isProxyDownload ?? false;

  useEffect(() => {
    if (!autoDownload || !primaryProxyDownload || !actions[0] || attempted.current) return;

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
    frame.src = actions[0].href;
    document.body.appendChild(frame);
    window.setTimeout(() => frame.remove(), 60_000);
  }, [autoDownload, primaryProxyDownload, actions, orderId]);

  // Nothing to deliver — render nothing.
  if (actions.length === 0) return null;

  const Icon = actions[0].icon;
  const trimmedMessage = String(message || '').trim();

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

      {/* Actions: one horizontal row on desktop, stacked on mobile. `flex-wrap`
          keeps two long labels from overflowing a narrow screen. */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        {actions.map((action, index) => {
          const ActionIcon = action.icon;
          const isPrimary = index === 0;

          return (
            <a
              key={`${action.href}-${index}`}
              href={action.href}
              // A proxied download is same-origin, so the browser honours the
              // `download` attribute; external links open in a new tab instead.
              {...(action.isProxyDownload
                ? { download: '' }
                : { target: '_blank', rel: 'noopener noreferrer' })}
              className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all active:scale-[0.98] ${
                isPrimary
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20 hover:shadow-cyan-500/35'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/20 hover:shadow-emerald-500/35'
              }`}
            >
              <ActionIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{action.label}</span>
              {action.isFile ? (
                <Download className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
              )}
            </a>
          );
        })}
      </div>

      {primaryProxyDownload && (
        <p className="mt-2 text-[11px] text-gray-400">
          Your download should start automatically. If it doesn&apos;t, tap the button above.
        </p>
      )}
    </div>
  );
}

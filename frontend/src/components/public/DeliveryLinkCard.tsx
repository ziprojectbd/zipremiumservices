import { Chrome, Download, ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';

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
   * Surface this card is rendered on. The order history page is dark and the
   * order details page is light, so the card has to adapt rather than assume
   * one background.
   */
  theme?: 'dark' | 'light';
}

/** Chrome Web Store install pages get browser-specific wording/icon. */
function isChromeStoreLink(url: string): boolean {
  return /chromewebstore\.google\.com|chrome\.google\.com\/webstore/i.test(url);
}

function isExtensionFile(url: string): boolean {
  return /\.(crx|zip)(\?|#|$)/i.test(url);
}

/**
 * Delivery instructions shown to a customer after their order is fulfilled.
 *
 * Used for products whose delivery is a download/install step (a browser
 * extension, for example) rather than an API key. The link is opened in a new
 * tab with `noopener noreferrer` so the storefront tab is never hijacked.
 */
export default function DeliveryLinkCard({
  link,
  label,
  message,
  children,
  className = '',
  theme = 'dark',
}: DeliveryLinkCardProps) {
  const url = String(link || '').trim();
  if (!url) return null;

  const chromeStore = isChromeStoreLink(url);
  const defaultLabel = chromeStore ? 'Add to Chrome' : isExtensionFile(url) ? 'Download' : 'Open Link';
  const buttonLabel = String(label || '').trim() || defaultLabel;
  const trimmedMessage = String(message || '').trim();

  const Icon = chromeStore ? Chrome : isExtensionFile(url) ? Download : ExternalLink;

  const isLight = theme === 'light';
  const cardClass = isLight
    ? 'border-cyan-200 bg-cyan-50'
    : 'border-cyan-500/25 bg-gradient-to-r from-cyan-500/10 to-blue-500/10';
  const titleClass = isLight ? 'text-gray-900' : 'text-white';
  const messageClass = isLight ? 'text-gray-700' : 'text-gray-200';

  return (
    <div className={`rounded-2xl border p-3 sm:p-4 ${cardClass} ${className}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <h4 className={`font-semibold text-sm sm:text-base ${titleClass}`}>Your Delivery</h4>
      </div>

      {trimmedMessage && (
        <p className={`text-xs sm:text-sm whitespace-pre-wrap mb-3 leading-relaxed ${messageClass}`}>
          {trimmedMessage}
        </p>
      )}

      {children}

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all active:scale-[0.98]"
      >
        <Icon className="w-4 h-4" />
        {buttonLabel}
        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
      </a>
    </div>
  );
}

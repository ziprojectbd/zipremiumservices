import type { CartItem } from '../../types';
import { History } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';
import DeliveryLinkCard from './DeliveryLinkCard';

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
  items: CartItem[];
  paymentMethod: string;
  trxId: string;
  payerNumber: string;
  txHash?: string;
  walletAddress?: string;
  orderNumber?: string;
  email?: string;
  paymentStatus?: string;
  transactionId?: string;
  paymentNumber?: string;
  paidVia?: string;
  selectedNetwork?: string;
  selectedPlatform?: string;
  senderUid?: string;
  cryptoCurrency?: string;
  currency?: string;
  captchaApiKey?: string | null;
  deliveryNote?: string;
  // Frozen at delivery time from the product's delivery instructions.
  deliveryLink?: string;
  deliveryLinkLabel?: string;
  // Optional second delivery action (e.g. the companion Chrome extension).
  deliveryLink2?: string;
  deliveryLink2Label?: string;
  deliveryMessage?: string;
}

export interface OrderHistoryProps {
  orders: Order[];
  onReorder: (order: Order) => void;
}

const statusStyles = {
  pending: {
    dot: 'bg-amber-400',
    pill: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
    label: 'Pending',
  },
  processing: {
    dot: 'bg-sky-400 animate-pulse',
    pill: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
    label: 'Processing',
  },
  completed: {
    dot: 'bg-emerald-400',
    pill: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    label: 'Completed',
  },
  cancelled: {
    dot: 'bg-rose-400',
    pill: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
    label: 'Cancelled',
  },
} as const;

export default function OrderHistory({ orders, onReorder }: OrderHistoryProps) {
  const navigate = useNavigate();

  const openDetails = (order: Order) => {
    const cleanOrderNumber = (order.orderNumber || '').replace(/^#/, '');
    navigate(`/order-history/details/${encodeURIComponent(cleanOrderNumber || order.id)}`);
  };

  const getCurrencySymbol = (currency?: string) => {
    return currency === 'USDT' ? '$' : '৳';
  };

  const formatOrderPrice = (price: number, currency?: string) => {
    // BDT is whole numbers only — no decimals; USDT keeps 2.
    const decimals = currency === 'USDT' ? 2 : 0;
    return `${getCurrencySymbol(currency)}${formatPrice(price, decimals)}`;
  };

  const methodLabel = (method: string) =>
    method === 'metamask_usdt_bsc' ? 'USDT (BSC)' : method;

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Order History
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              All of your past orders, in one place.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 py-20 text-center">
            <History className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-white mb-1">
              No Order History
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              You haven't placed any orders yet.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-950 transition-colors hover:bg-gray-200"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const s = statusStyles[order.status];
              return (
                <article
                  key={order.id}
                  className="group rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 sm:p-7 transition-all hover:border-white/20"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${s.pill}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                    <span className="font-mono text-xs text-gray-500">
                      #{order.orderNumber || order.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(order.date).toLocaleDateString()}
                    </span>
                    <div className="ml-auto">
                      <span className="text-lg sm:text-xl font-semibold tracking-tight text-white">
                        {formatOrderPrice(order.total, order.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm text-gray-300">
                          {(item as any).productName || item.name}
                        </span>
                        <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-gray-400">
                          ×{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.status === 'completed' && (
                    <div className="mt-5">
                      <DeliveryLinkCard
                        link={order.deliveryLink}
                        label={order.deliveryLinkLabel}
                        link2={order.deliveryLink2}
                        label2={order.deliveryLink2Label}
                        message={order.deliveryMessage}
                        orderId={order.id}
                        autoDownload
                      />
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
                    <span className="text-xs text-gray-500">
                      Paid via{' '}
                      <span className="font-medium text-gray-300">
                        {methodLabel(order.paymentMethod)}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      {order.status === 'completed' && (
                        <button
                          onClick={() => onReorder(order)}
                          className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-white/25 hover:text-white"
                        >
                          Reorder
                        </button>
                      )}
                      <button
                        onClick={() => openDetails(order)}
                        className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-950 transition-colors hover:bg-gray-200"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

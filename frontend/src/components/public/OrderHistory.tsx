import type { CartItem } from '../../types';
import { History } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';

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
}

export interface OrderHistoryProps {
  orders: Order[];
  onReorder: (order: Order) => void;
}

export default function OrderHistory({ orders, onReorder }: OrderHistoryProps) {
  const navigate = useNavigate();

  const openDetails = (order: Order) => {
    const cleanOrderNumber = (order.orderNumber || '').replace(/^#/, '');
    navigate(`/order-history/details/${encodeURIComponent(cleanOrderNumber || order.id)}`);
  };

  const isCrypto = (order: Order) => String(order.paymentMethod || '').toLowerCase() === 'paycrypto';

  const getCurrencySymbol = (currency?: string) => {
    return currency === 'USDT' ? '$' : '৳';
  };

  const formatOrderPrice = (price: number, currency?: string) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${formatPrice(price, 2)}`;
  };

  return (
    <section className="bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 py-10 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">
              Order History
            </h2>
            <p className="text-gray-400">
              View all your past orders
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {order.orderNumber ? `Order #${order.orderNumber}` : `Order #${order.id}`}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Placed on {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-2 md:mt-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : order.status === "processing"
                        ? "bg-blue-500/20 text-blue-400"
                        : order.status === "completed"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                  <span className="text-lg font-bold text-white">
                    {formatOrderPrice(order.total, order.currency)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-white mb-2">
                    Items:
                  </h4>
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-300">
                          {(item as any).productName || item.name} x{item.quantity}
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="text-white">৳{formatPrice(item.price * item.quantity, 2)}</span>
                          {isCrypto(order) && (item as any).usdtAmount && (
                            <span className="text-gray-400 text-xs">${formatPrice((item as any).usdtAmount * item.quantity, 2)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">
                    Payment Details:
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-300">
                        Method:
                      </span>
                      <span className="text-white">
                        {order.paymentMethod === "metamask_usdt_bsc"
                          ? "USDT (BSC)"
                          : order.paymentMethod}
                      </span>
                    </div>
                    {order.txHash ? (
                      <div className="flex justify-between">
                        <span className="text-gray-300">
                          TxHash:
                        </span>
                        <span className="text-white font-mono text-xs truncate max-w-[200px]">
                          {order.txHash.slice(0, 10)}...{order.txHash.slice(-6)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-300">
                          TrxID:
                        </span>
                        <span className="text-white font-mono">
                          {order.trxId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => openDetails(order)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                >
                  View Details
                </button>
                {order.status === "completed" && (
                  <button
                    onClick={() => onReorder(order)}
                    className="px-4 py-2 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/10 transition-colors"
                  >
                    Reorder
                  </button>
                )}
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-20 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Order History
              </h3>
              <p className="text-gray-400 mb-6">
                You haven't placed any orders yet.
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
              >
                Start Shopping
              </button>
            </div>
          )}
        </div>
      </div>

    </section>
  );
}

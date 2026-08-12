import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useShopContext } from '../../store/ShopContext';
import { History, Zap, Clock, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../lib/axios';
import type { Order } from '../../types';
import { formatPrice } from '../../utils/formatPrice';

/** Normalize a raw DB status to our frontend Order status */
function normalizeStatus(raw: string): Order['status'] {
  const s = String(raw || '').toLowerCase();
  if (s === 'approved' || s === 'delivered' || s === 'completed') return 'completed';
  if (s === 'rejected' || s === 'cancelled') return 'cancelled';
  if (s === 'processing') return 'processing';
  return 'pending';
}

/** Map a raw DB order object to the frontend Order type */
function mapOrder(raw: any): Order {
  const items = Array.isArray(raw.items) && raw.items.length
    ? raw.items.map((item: any, index: number) => ({
        id: Date.now() + index,
        name: item?.productName || item?.name || raw.productName || 'Product',
        description: '',
        price: Number(item?.price ?? item?.usdtAmount ?? 0),
        originalPrice: Number(item?.price ?? item?.usdtAmount ?? 0),
        category: item?.category || '',
        features: [],
        quantity: Number(item?.quantity || 1),
        link: item?.link || '',
        smmServiceId: item?.smmServiceId || '',
        smmProvider: item?.smmProvider || '',
        smmOrderId: item?.smmOrderId || '',
        details: item?.details || '',
      }))
    : [
        {
          id: Date.now(),
          name: raw.productName || 'Product',
          description: '',
          price: Number(raw.amount || 0),
          originalPrice: Number(raw.amount || 0),
          category: '',
          features: [],
          quantity: 1,
        },
      ];

  return {
    id: raw._id,
    orderNumber: raw.orderNumber,
    date: raw.createdAt || raw.created_at || new Date().toISOString(),
    status: normalizeStatus(raw.status),
    total: Number(raw.amount || 0),
    items: items as any,
    email: raw.email || '',
    paymentMethod: raw.paymentMethod || raw.payment_method || '',
    paymentStatus: raw.paymentStatus || raw.payment_status || '',
    trxId: raw.transactionId || raw.transaction_id || raw.txHash || '',
    transactionId: raw.transactionId || raw.transaction_id || '',
    payerNumber: raw.paymentNumber || raw.payment_number || '',
    paymentNumber: raw.paymentNumber || raw.payment_number || '',
    txHash: raw.txHash || '',
    walletAddress: raw.walletAddress || raw.wallet_address || '',
    paidVia: raw.paidVia || raw.paid_via || '',
    selectedNetwork: raw.selectedNetwork || raw.selected_network || '',
    selectedPlatform: raw.selectedPlatform || raw.selected_platform || '',
    senderUid: raw.senderUid || raw.sender_uid || '',
    cryptoCurrency: raw.cryptoCurrency || raw.crypto_currency || '',
    currency: raw.currency || 'BDT',
    deliveryNote: raw.deliveryNote || '',
    captchaApiKey: raw.captchaApiKey || null,
    p2pToken: raw.p2pToken || '',
    p2pNetwork: raw.p2pNetwork || '',
    p2pWalletAddress: raw.p2pWalletAddress || '',
    couponCode: raw.couponCode || '',
    discountAmount: raw.discountAmount || 0,
    discountType: raw.discountType || '',
  };
}

export default function OrderDetails() {
  const navigate = useNavigate();
  const params = useParams();
  const orderId = (params?.id as string || '').replace(/^#/, '');
  const { isLoggedIn, showAlert } = useShopContext();

  const [copiedField, setCopiedField] = useState<string>('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [pageLoading, setPageLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/sign-in');
      return;
    }
    if (!orderId) return;

    const fetchOrder = async () => {
      setPageLoading(true);
      setFetchError(false);
      try {
        const res = await api.get(`/orders/${encodeURIComponent(orderId)}`);
        if (!res.data.success || !res.data.data) {
          setFetchError(true);
          setOrder(null);
        } else {
          setOrder(mapOrder(res.data.data));
          setFetchError(false);
        }
      } catch {
        setFetchError(true);
        setOrder(null);
      } finally {
        setPageLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isLoggedIn, navigate]);

  const isCrypto = (o: Order) => String(o.paymentMethod || '').toLowerCase() === 'paycrypto';
  const isNetwork = (o: Order) => String(o.paidVia || '').toLowerCase() === 'network';

  const copyText = async (fieldKey: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value || '');
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(''), 1200);
    } catch {
      // ignore
    }
  };

  const getCurrencySymbol = (currency?: string) => (currency === 'USDT' ? '$' : '৳');
  const formatOrderPrice = (price: number, currency?: string) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${formatPrice(price, 2)}`;
  };

  const CopyBtn = ({ fieldKey, value }: { fieldKey: string; value: string }) => (
    <button
      type="button"
      onClick={() => copyText(fieldKey, value)}
      className="ml-2 px-2 py-0.5 rounded-md border border-blue-400/30 text-[10px] text-blue-300 hover:bg-blue-500/10"
    >
      {copiedField === fieldKey ? 'Copied' : 'Copy'}
    </button>
  );

  const toggleKeyVisibility = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  if (pageLoading && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order || fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100">
        <div className="flex flex-col items-center justify-center py-20">
          <History className="w-16 h-16 mb-4 text-gray-500" />
          <h3 className="text-xl font-semibold text-white mb-2">Order Not Found</h3>
          <p className="text-gray-400 mb-6">The order you are looking for does not exist.</p>
          <button
            onClick={() => navigate('/order-history')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
          >
            Back to Order History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100 transition-colors">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate('/order-history')}
          className="mb-6 text-sm px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/5 transition-colors"
        >
          &larr; Back to Order History
        </button>

        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950 border border-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-5">
            <div>
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Order Details
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Full payment and item breakdown</p>
            </div>
          </div>

          {/* Order Progress Stepper */}
          <div className="mb-6 px-2 sm:px-4">
            <div className="relative flex justify-between items-center w-full">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 -z-10" />
              <div
                className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 -translate-y-1/2 -z-10 transition-all duration-500"
                style={{
                  width:
                    order.status === 'pending'
                      ? '0%'
                      : order.status === 'processing'
                        ? '50%'
                        : order.status === 'completed'
                          ? '100%'
                          : '0%',
                }}
              />

              {[
                { label: 'Pending', status: 'pending', icon: Clock },
                { label: 'Processing', status: 'processing', icon: Zap },
                { label: 'Completed', status: 'completed', icon: Check },
              ].map((step, index) => {
                const Icon = step.icon;
                const isActive = order.status === step.status;
                const isCompleted =
                  (order.status === 'processing' && step.status === 'pending') ||
                  (order.status === 'completed' && (step.status === 'pending' || step.status === 'processing')) ||
                  order.status === step.status;

                return (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                        isActive
                          ? 'bg-slate-900 border-purple-500 text-purple-500 shadow-lg shadow-purple-500/20 scale-110'
                          : isCompleted
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-slate-900 border-white/10 text-gray-400'
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs mt-2 font-medium ${
                        isActive ? 'text-purple-500' : isCompleted ? 'text-blue-500' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {order.status === 'cancelled' && (
              <div className="mt-4 flex items-center justify-center gap-2 text-red-500 bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">This order has been cancelled</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <span className="text-gray-500 block text-xs mb-1">Order ID:</span>
              <span className="font-medium text-white inline-flex items-center flex-wrap text-xs sm:text-sm">
                {order.orderNumber || order.id}
                <CopyBtn fieldKey="order_id" value={order.orderNumber || order.id} />
              </span>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <span className="text-gray-500 block text-xs mb-1">Email:</span>
              <span className="font-medium text-white inline-flex items-center flex-wrap text-xs sm:text-sm break-all">
                {order.email || '-'}
                <CopyBtn fieldKey="email" value={order.email || '-'} />
              </span>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
              <span className="text-gray-500 block text-xs mb-1">Amount:</span>
              <span className="font-semibold text-white text-xs sm:text-sm">{formatOrderPrice(order.total, order.currency)}</span>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <span className="text-gray-500 block text-xs mb-1">Status:</span>
              <span className="font-semibold capitalize text-white text-xs sm:text-sm">{order.status}</span>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
              <span className="text-gray-500 block text-xs mb-1">Payment Method:</span>
              <span className="font-medium text-white text-xs sm:text-sm">{order.paymentMethod || '-'}</span>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20">
              <span className="text-gray-500 block text-xs mb-1">Payment Status:</span>
              <span className="font-medium text-white text-xs sm:text-sm">{order.paymentStatus || '-'}</span>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
            <h4 className="font-semibold text-white mb-2 text-sm sm:text-base">Payment Details</h4>
            {!isCrypto(order) ? (
              <div className="space-y-2 text-xs sm:text-sm">
                <p className="text-gray-200">
                  <span className="text-gray-500 block mb-1">Payment Number:</span>
                  <span className="inline-flex items-center flex-wrap break-all">
                    {order.paymentNumber || order.payerNumber || '-'}
                    <CopyBtn fieldKey="payment_number" value={order.paymentNumber || order.payerNumber || '-'} />
                  </span>
                </p>
                <p className="text-gray-200">
                  <span className="text-gray-500 block mb-1">Transaction ID:</span>
                  <span className="inline-flex items-center flex-wrap break-all">
                    {order.transactionId || order.trxId || '-'}
                    <CopyBtn fieldKey="transaction_id" value={order.transactionId || order.trxId || '-'} />
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs sm:text-sm">
                <p className="text-gray-200">
                  <span className="text-gray-500">Currency:</span> {order.cryptoCurrency || 'USDT'}
                </p>
                <p className="text-gray-200">
                  <span className="text-gray-500">Paid Via:</span> {order.paidVia || '-'}
                </p>
                <p className="text-gray-200">
                  <span className="text-gray-500 block mb-1">{isNetwork(order) ? 'Selected Network' : 'Selected Platform'}:</span>
                  <span className="break-all">{isNetwork(order) ? order.selectedNetwork || '-' : order.selectedPlatform || '-'}</span>
                </p>
                {isNetwork(order) ? (
                  <>
                    <p className="text-gray-200">
                      <span className="text-gray-500 block mb-1">Wallet Address:</span>
                      <span className="inline-flex items-center flex-wrap break-all">
                        {order.walletAddress || '-'}
                        <CopyBtn fieldKey="wallet_address" value={order.walletAddress || '-'} />
                      </span>
                    </p>
                    <p className="text-gray-200">
                      <span className="text-gray-500 block mb-1">Transaction Hash:</span>
                      <span className="inline-flex items-center flex-wrap break-all">
                        {order.txHash || '-'}
                        <CopyBtn fieldKey="tx_hash" value={order.txHash || '-'} />
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-gray-200">
                    <span className="text-gray-500 block mb-1">Sender UID:</span>
                    <span className="inline-flex items-center flex-wrap break-all">
                      {order.senderUid || '-'}
                      <CopyBtn fieldKey="sender_uid" value={order.senderUid || '-'} />
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <h4 className="font-semibold text-white mb-2 text-sm sm:text-base">Items</h4>
            <div className="space-y-2">
              {order.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex flex-col text-xs sm:text-sm text-gray-200 bg-white/5 rounded-lg px-3 py-2 border border-white/10"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="mb-1 sm:mb-0">
                      {item.productName || item.name} x{item.quantity}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:gap-2 text-right">
                      <span className="font-medium">৳{formatPrice(item.price * item.quantity, 2)}</span>
                      {isCrypto(order) && item.usdtAmount && (
                        <span className="text-gray-500 text-xs sm:text-sm">
                          ${formatPrice(item.usdtAmount * item.quantity, 2)}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.link && (
                    <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 mt-1 pt-1 border-t border-white/10">
                      <span className="mb-0.5 sm:mb-0">Target Link:</span>
                      <span className="text-cyan-300 break-all text-right font-mono">{item.link}</span>
                    </div>
                  )}
                  {item.smmServiceId && (
                    <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 mt-0.5">
                      <span className="mb-0.5 sm:mb-0">Service ID:</span>
                      <span className="text-orange-300 font-mono">{item.smmServiceId}</span>
                    </div>
                  )}
                  {item.smmOrderId && (
                    <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 mt-0.5">
                      <span className="mb-0.5 sm:mb-0">SMM Order ID:</span>
                      <span className="text-green-300 font-mono">{item.smmOrderId}</span>
                    </div>
                  )}
                  {item.details && (
                    <details className="text-xs mt-1 pt-1 border-t border-white/10">
                      <summary className="text-blue-500 cursor-pointer hover:text-blue-400 font-medium">
                        Service info & instructions
                      </summary>
                      <div className="mt-1 p-2 bg-gray-800/50 rounded-lg whitespace-pre-wrap text-gray-300 leading-relaxed">
                        {item.details}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* P2P Trade Details */}
          {Array.isArray(order.items) &&
            order.items.some(
              (item: any) => (item.productName || item.name || '').includes('P2P Fee')
            ) && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                <h4 className="font-semibold text-white mb-2 text-sm sm:text-base">P2P Trade Details</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  {order.p2pToken && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Token:</span>
                      <span className="text-white break-all text-right">{order.p2pToken}</span>
                    </div>
                  )}
                  {order.p2pNetwork && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Network:</span>
                      <span className="text-white break-all text-right">{order.p2pNetwork}</span>
                    </div>
                  )}
                  {order.p2pWalletAddress && (
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-gray-300 mb-1 sm:mb-0">Wallet Address:</span>
                      <span className="text-white break-all text-right inline-flex items-center flex-wrap justify-end">
                        {order.p2pWalletAddress}
                        <CopyBtn fieldKey="p2p_wallet_user" value={order.p2pWalletAddress} />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

          {order.captchaApiKey && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-green-500/10">
              <h4 className="font-semibold text-white mb-2 text-sm sm:text-base">Captcha API Key</h4>
              <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm">
                <span className="text-gray-300 mb-1 sm:mb-0">API Key:</span>
                <span className="text-white break-all text-right inline-flex items-center flex-wrap justify-end font-mono">
                  {visibleKeys.has('captcha_api_key')
                    ? order.captchaApiKey
                    : order.captchaApiKey.slice(0, 12) + '.'.repeat(20)}
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('captcha_api_key')}
                    className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-md border border-white/20 text-gray-300 hover:bg-white/10"
                    title={visibleKeys.has('captcha_api_key') ? 'Hide key' : 'Show key'}
                  >
                    {visibleKeys.has('captcha_api_key') ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  {visibleKeys.has('captcha_api_key') && <CopyBtn fieldKey="captcha_api_key" value={order.captchaApiKey} />}
                </span>
              </div>
            </div>
          )}

          {order.deliveryNote && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-2xl border border-green-500/20 bg-gradient-to-r from-green-500/10 to-teal-500/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white text-sm sm:text-base">Delivery Note</h4>
                <CopyBtn fieldKey="delivery_note" value={order.deliveryNote} />
              </div>
              <p className="text-gray-200 text-xs sm:text-sm whitespace-pre-wrap">{order.deliveryNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

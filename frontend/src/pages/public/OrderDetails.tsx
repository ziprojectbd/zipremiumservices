import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useShopContext } from '../../store/ShopContext';
import { History, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../lib/axios';
import type { Order } from '../../types';
import { formatPrice } from '../../utils/formatPrice';
import DeliveryLinkCard from '../../components/public/DeliveryLinkCard';

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
    deliveryLink: raw.deliveryLink || '',
    deliveryLinkLabel: raw.deliveryLinkLabel || '',
    deliveryMessage: raw.deliveryMessage || '',
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
      className="ml-2 px-1.5 py-0.5 rounded border border-white/15 text-[10px] text-gray-400 hover:text-white hover:border-white/30 transition-colors"
    >
      {copiedField === fieldKey ? 'Copied' : 'Copy'}
    </button>
  );

  /** One label/value row. Keeps every section visually identical. */
  const Field = ({
    label,
    value,
    copyKey,
    mono = false,
  }: {
    label: string;
    value?: string | number | null;
    copyKey?: string;
    mono?: boolean;
  }) => {
    const text = value === 0 ? '0' : String(value ?? '').trim();
    if (!text) return null;
    return (
      <div className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
        <span className="text-xs text-gray-500 shrink-0 pt-0.5">{label}</span>
        <span
          className={`text-xs sm:text-sm text-gray-100 text-right break-all inline-flex items-center justify-end flex-wrap ${
            mono ? 'font-mono' : ''
          }`}
        >
          {text}
          {copyKey && <CopyBtn fieldKey={copyKey} value={text} />}
        </span>
      </div>
    );
  };

  /** Section wrapper — one surface, one border, no per-section gradients. */
  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <section className="mt-4 border border-white/10 rounded-xl bg-white/[0.02] px-3 sm:px-4 py-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
        {title}
      </h4>
      {children}
    </section>
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

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Order Details</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {order.orderNumber ? `Order #${order.orderNumber}` : `Order #${order.id}`}
                {' · '}
                {new Date(order.date).toLocaleString()}
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize shrink-0 ${
                order.status === 'completed'
                  ? 'bg-green-500/15 text-green-400'
                  : order.status === 'processing'
                    ? 'bg-blue-500/15 text-blue-400'
                    : order.status === 'cancelled'
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-yellow-500/15 text-yellow-400'
              }`}
            >
              {order.status}
            </span>
          </div>

          {/* Delivery link (e.g. install a browser extension) */}
          <DeliveryLinkCard
            link={order.deliveryLink}
            label={order.deliveryLinkLabel}
            message={order.deliveryMessage}
          />

          {order.status === 'cancelled' && (
            <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 py-2.5 px-3 rounded-lg border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium">This order has been cancelled</span>
            </div>
          )}

          {/* Summary */}
          <Section title="Summary">
            <Field label="Order ID" value={order.orderNumber || order.id} copyKey="order_id" />
            <Field label="Email" value={order.email} copyKey="email" />
            <Field label="Amount" value={formatOrderPrice(order.total, order.currency)} />
            <Field label="Status" value={order.status} />
            <Field label="Payment Method" value={order.paymentMethod} />
            <Field label="Payment Status" value={order.paymentStatus} />
          </Section>

          {/* Payment details — mobile wallet vs crypto */}
          {!isCrypto(order) ? (
            <Section title="Payment Details">
              <Field
                label="Payment Number"
                value={order.paymentNumber || order.payerNumber}
                copyKey="payment_number"
                mono
              />
              <Field
                label="Transaction ID"
                value={order.transactionId || order.trxId}
                copyKey="transaction_id"
                mono
              />
            </Section>
          ) : (
            <Section title="Payment Details">
              <Field label="Currency" value={order.cryptoCurrency || 'USDT'} />
              <Field label="Paid Via" value={order.paidVia} />
              <Field
                label={isNetwork(order) ? 'Selected Network' : 'Selected Platform'}
                value={isNetwork(order) ? order.selectedNetwork : order.selectedPlatform}
              />
              {isNetwork(order) ? (
                <>
                  <Field label="Wallet Address" value={order.walletAddress} copyKey="wallet_address" mono />
                  <Field label="Transaction Hash" value={order.txHash} copyKey="tx_hash" mono />
                </>
              ) : (
                <Field label="Sender UID" value={order.senderUid} copyKey="sender_uid" mono />
              )}
            </Section>
          )}

          {/* Items */}
          <Section title={`Items (${order.items.length})`}>
            <div className="divide-y divide-white/5">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs sm:text-sm text-gray-100 min-w-0">
                      {item.productName || item.name}
                      <span className="text-gray-500"> ×{item.quantity}</span>
                    </span>
                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-medium text-gray-100">
                        ৳{formatPrice(item.price * item.quantity, 2)}
                      </div>
                      {isCrypto(order) && item.usdtAmount && (
                        <div className="text-[11px] text-gray-500">
                          ${formatPrice(item.usdtAmount * item.quantity, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.link && (
                    <div className="mt-1 text-[11px] text-gray-500">
                      Link: <span className="font-mono text-cyan-400/90 break-all">{item.link}</span>
                    </div>
                  )}
                  {item.smmServiceId && (
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      Service ID: <span className="font-mono text-orange-400/90">{item.smmServiceId}</span>
                    </div>
                  )}
                  {item.smmOrderId && (
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      SMM Order ID: <span className="font-mono text-green-400/90">{item.smmOrderId}</span>
                    </div>
                  )}
                  {item.details && (
                    <details className="mt-1.5">
                      <summary className="text-[11px] text-blue-400 cursor-pointer hover:text-blue-300">
                        Service info &amp; instructions
                      </summary>
                      <div className="mt-1.5 p-2.5 bg-black/20 rounded-lg whitespace-pre-wrap text-[11px] text-gray-300 leading-relaxed">
                        {item.details}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* P2P Trade Details */}
          {order.items.some((item: any) => (item.productName || item.name || '').includes('P2P Fee')) && (
            <Section title="P2P Trade Details">
              <Field label="Token" value={order.p2pToken} />
              <Field label="Network" value={order.p2pNetwork} />
              <Field
                label="Wallet Address"
                value={order.p2pWalletAddress}
                copyKey="p2p_wallet_user"
                mono
              />
            </Section>
          )}

          {/* Captcha API Key */}
          {order.captchaApiKey && (
            <Section title="Captcha API Key">
              <div className="flex items-start justify-between gap-3 py-2">
                <span className="text-xs text-gray-500 pt-0.5">API Key</span>
                <span className="inline-flex items-center justify-end flex-wrap gap-1 text-right">
                  <code className="text-xs sm:text-sm font-mono text-emerald-300 break-all">
                    {visibleKeys.has('captcha_api_key')
                      ? order.captchaApiKey
                      : order.captchaApiKey.slice(0, 12) + '.'.repeat(20)}
                  </code>
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('captcha_api_key')}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                    title={visibleKeys.has('captcha_api_key') ? 'Hide key' : 'Show key'}
                  >
                    {visibleKeys.has('captcha_api_key') ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {visibleKeys.has('captcha_api_key') && (
                    <CopyBtn fieldKey="captcha_api_key" value={order.captchaApiKey} />
                  )}
                </span>
              </div>
            </Section>
          )}

          {/* Delivery Note */}
          {order.deliveryNote && (
            <Section title="Delivery Note">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs sm:text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {order.deliveryNote}
                </p>
                <CopyBtn fieldKey="delivery_note" value={order.deliveryNote} />
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

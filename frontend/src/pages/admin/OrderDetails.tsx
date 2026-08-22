import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Truck, Clock3 } from 'lucide-react';
import api from '../../lib/axios';
import {
  Order,
  ApiResponse,
  StatusBadge,
  PaymentMethodBadge,
  CopyBtn,
  DetailRow,
  formatDateTime,
  formatPrice,
  normalizePaymentStatus,
  normalizeOrderStatus,
  isCryptoOrder,
} from './components/OrderHelpers';

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------
function LoadingSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 sm:p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-white/10 rounded w-48" />
        <div className="h-4 bg-white/10 rounded w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="h-40 bg-white/10 rounded" />
          <div className="h-40 bg-white/10 rounded" />
        </div>
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-4 bg-white/10 rounded w-1/2" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast Component
// ---------------------------------------------------------------------------
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 ${
        type === 'success'
          ? 'bg-green-900/90 border-green-500/30 text-green-200'
          : 'bg-red-900/90 border-red-500/30 text-red-200'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-green-400" />
      ) : (
        <XCircle className="w-5 h-5 text-red-400" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info Card Wrapper
// ---------------------------------------------------------------------------
function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">{title}</h3>
      <div className="space-y-2.5 text-xs sm:text-sm">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OrderDetails Page
// ---------------------------------------------------------------------------
export default function AdminOrderDetails() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const actionBusyRef = useRef(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliverNote, setDeliverNote] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  // ---- Fetch order ----
  const fetchOrder = useCallback(async () => {
    if (!orderNumber) return;
    try {
      const res = await api.get(`/admin/orders/${orderNumber}`);
      const json: ApiResponse<Order> = res.data;
      if (json.success && json.data) {
        setOrder(json.data);
        setNotFound(false);
        setError(null);
      } else {
        setNotFound(true);
        setOrder(null);
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setNotFound(true);
        setOrder(null);
      } else {
        setError(err?.response?.data?.error || 'Failed to load order details');
        setOrder(null);
      }
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    setLoading(true);
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  // ---- Actions ----
  const runAction = async (action: 'verify' | 'reject' | 'approve') => {
    if (!order || actionBusyRef.current) return;
    actionBusyRef.current = true;
    setActionLoading(true);
    try {
      const actionMap: Record<string, string> = {
        verify: 'verify_payment',
        reject: 'reject_payment',
        approve: 'approve_order',
      };
      const res = await api.put(`/admin/orders/${order._id}`, { action: actionMap[action] });
      const json: ApiResponse<Order> = res.data;
      if (!json.success) {
        showToast(json.error || 'Failed to update order', 'error');
        return;
      }
      const messages: Record<string, string> = {
        verify: 'Payment verified successfully',
        reject: 'Payment rejected',
        approve: 'Order approved successfully',
      };
      showToast(messages[action], 'success');
      await fetchOrder();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to update order', 'error');
    } finally {
      setActionLoading(false);
      actionBusyRef.current = false;
    }
  };

  const handleDeliver = async () => {
    if (!order || actionBusyRef.current) return;
    setShowDeliverModal(false);
    actionBusyRef.current = true;
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/orders/${order._id}`, {
        action: 'deliver_order',
        deliveryNote: deliverNote.trim() || undefined,
      });
      const json: ApiResponse<Order> = res.data;
      if (!json.success) {
        showToast(json.error || 'Failed to deliver order', 'error');
        return;
      }
      showToast('Order delivered successfully', 'success');
      await fetchOrder();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to deliver order', 'error');
    } finally {
      setActionLoading(false);
      actionBusyRef.current = false;
    }
  };

  // ---- State: Loading ----
  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/orders')}
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </button>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  // ---- State: Not Found ----
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <XCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Order Not Found</h2>
        <p className="text-gray-400 mb-6">No order found with ID: {orderNumber}</p>
        <button
          onClick={() => navigate('/admin/orders')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  // ---- State: Error ----
  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <XCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Order</h2>
        <p className="text-gray-400 mb-6">{error || 'An unexpected error occurred'}</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/orders')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Back to Orders
          </button>
          <button
            onClick={() => { setLoading(true); setError(null); fetchOrder(); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ---- State: Success ----
  const payStatus = normalizePaymentStatus(order);
  const ordStatus = normalizeOrderStatus(order);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/orders')}
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Order {order.orderNumber || order._id}
            </h1>
            <StatusBadge type="order" status={ordStatus} />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!['delivered', 'rejected'].includes(ordStatus) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {payStatus !== 'verified' && (
            <>
              <button
                onClick={() => runAction('verify')}
                disabled={actionLoading || actionBusyRef.current}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Verify Payment
              </button>
              <button
                onClick={() => runAction('reject')}
                disabled={actionLoading || actionBusyRef.current}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject Payment
              </button>
            </>
          )}
          {payStatus === 'verified' && (
            <button
              onClick={() => {
                setDeliverNote('');
                setShowDeliverModal(true);
              }}
              disabled={actionLoading || actionBusyRef.current}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Truck className="w-4 h-4" /> Deliver Order
            </button>
          )}
        </div>
      )}

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Order Info */}
        <InfoCard title="Order Information">
          <DetailRow label="Order Number:" value={order.orderNumber || order._id} copyBtn={<CopyBtn fieldKey="order_id" value={order.orderNumber || order._id} />} />
          <DetailRow label="Username:" value={order.username || '-'} />
          <DetailRow label="Email:" value={order.email || '-'} copyBtn={<CopyBtn fieldKey="email" value={order.email || '-'} />} />
          {(order.countryFlag || order.country) && (
            <DetailRow label="Country:" value={<span className="inline-flex items-center gap-1.5">{order.countryFlag && <span className="text-lg">{order.countryFlag}</span>}<span>{order.country || order.countryCode || '-'}</span></span>} />
          )}
          {order.ipAddress && (
            <DetailRow label="IP Address:" value={order.ipAddress} />
          )}
          <DetailRow label="Amount:" value={<span className="text-white font-medium">{formatPrice(order.amount ?? 0, order.currency)}</span>} />
          <DetailRow label="Currency:" value={order.currency || (isCryptoOrder(order) ? 'USDT' : 'BDT')} />
          <DetailRow label="Date:" value={formatDateTime(order.orderDate || order.createdAt || '')} />
          <DetailRow label="Order Status:" value={<StatusBadge type="order" status={ordStatus} />} />
        </InfoCard>

        {/* Payment Info */}
        <InfoCard title="Payment Information">
          <DetailRow label="Payment Method:" value={<PaymentMethodBadge method={order.payment_method || order.paymentMethod || '-'} />} />
          <DetailRow label="Payment Status:" value={<StatusBadge type="payment" status={payStatus} />} />
          {order.couponCode && (
            <DetailRow label="Coupon:" value={`${order.couponCode}${order.discountAmount ? ` (-${formatPrice(order.discountAmount, order.currency)})` : ''}`} />
          )}
          {!isCryptoOrder(order) && (
            <>
              <DetailRow label="Payment Number:" value={order.payment_number || order.paymentNumber || '-'} copyBtn={<CopyBtn fieldKey="payment_number" value={order.payment_number || order.paymentNumber || '-'} />} />
              <DetailRow label="Transaction ID:" value={order.transaction_id || order.transactionId || '-'} copyBtn={<CopyBtn fieldKey="transaction_id" value={order.transaction_id || order.transactionId || '-'} />} />
            </>
          )}
          {isCryptoOrder(order) && (
            <>
              {(order.paid_via || order.paidVia) === 'network' && (
                <DetailRow
                  label={<span className="inline-flex items-center gap-2">Transaction Hash:<span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">CRYPTO</span></span>}
                  value={order.txHash || '-'}
                  copyBtn={<CopyBtn fieldKey="tx_hash" value={order.txHash || '-'} />}
                />
              )}
              <DetailRow label="Currency:" value={order.crypto_currency || order.cryptoCurrency || '-'} />
              <DetailRow label="Paid Via:" value={(() => { const pv = (order.paid_via || order.paidVia || '-').toString(); return pv.toLowerCase() === 'uid' ? 'UID' : pv; })()} />
              <DetailRow label="Network/Platform:" value={(order.paid_via || order.paidVia) === 'network' ? (order.selected_network || order.selectedNetwork || '-') : (order.selected_platform || order.selectedPlatform || '-')} />
              <DetailRow
                label={(order.paid_via || order.paidVia) === 'network' ? 'Wallet Address:' : 'Sender UID:'}
                value={(order.paid_via || order.paidVia) === 'network' ? (order.wallet_address || order.walletAddress || '-') : (order.sender_uid || order.senderUid || '-')}
                copyBtn={(order.paid_via || order.paidVia) === 'network' ? <CopyBtn fieldKey="wallet_address" value={order.wallet_address || order.walletAddress || '-'} /> : <CopyBtn fieldKey="sender_uid" value={order.sender_uid || order.senderUid || '-'} />}
              />
            </>
          )}
        </InfoCard>
      </div>

      {/* Items */}
      {Array.isArray(order.items) && order.items.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 sm:p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            Order Items ({order.items.length})
          </h3>
          <div className="space-y-3">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm">{item.productName || item.name || 'Product'}</span>
                    {item.category && (
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-300 text-xs sm:text-sm">x{item.quantity || 1}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-400 mt-1.5">
                  <span>Unit Price: {formatPrice((item.price || 0) / (item.quantity || 1), order.currency)}</span>
                  <span>Total: {formatPrice(item.price || 0, order.currency)}</span>
                  {isCryptoOrder(order) && item.usdtAmount && (
                    <span className="text-gray-500">${item.usdtAmount?.toFixed?.(2) ?? (item.usdtAmount ?? 0)}</span>
                  )}
                </div>
                {item.link && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:justify-between text-xs">
                    <span className="text-gray-400 mb-1 sm:mb-0">Target Link:</span>
                    <span className="text-cyan-300 break-all text-right font-mono">{item.link}</span>
                  </div>
                )}
                {item.smmServiceId && (
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-400 mt-1">
                    <span>Service ID:</span>
                    <span className="text-orange-300 font-mono">{item.smmServiceId}</span>
                  </div>
                )}
                {item.smmOrderId && (
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-400 mt-1">
                    <span>SMM Order ID:</span>
                    <span className="text-green-300 font-mono">{item.smmOrderId}</span>
                  </div>
                )}
                {item.details && (
                  <details className="text-xs mt-2 pt-2 border-t border-white/5">
                    <summary className="text-blue-400 cursor-pointer hover:text-blue-300 font-medium">
                      Service info & instructions
                    </summary>
                    <div className="mt-1 p-2 bg-gray-800/50 rounded-lg whitespace-pre-wrap text-gray-300 leading-relaxed">
                      {item.details}
                    </div>
                  </details>
                )}
                {item.customData && Object.keys(item.customData).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    {Object.entries(item.customData).map(([key, val]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-400 mt-1">
                        <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-gray-200">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes & Extras */}
      {(order.notes || order.deliveryNote || order.captchaApiKey || (order as any).delivery?.status === 'failed' || (Array.isArray(order.items) && order.items.some((i: any) => (i.productName || i.name || '').includes('P2P Fee')))) && (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 sm:p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Additional Info</h3>
          <div className="space-y-2.5 text-xs sm:text-sm">
            {order.deliveryNote && (
              <DetailRow label="Delivery Note:" value={order.deliveryNote} />
            )}
            {order.notes && (
              <DetailRow label="Notes:" value={order.notes} />
            )}
            {order.captchaApiKey && (
              <DetailRow label="Captcha API Key:" value={order.captchaApiKey} copyBtn={<CopyBtn fieldKey="captcha_api_key" value={order.captchaApiKey} />} />
            )}
            {(order as any).delivery?.status === 'failed' && (
              <DetailRow label="Delivery Error:" value={<span className="text-red-400">{(order as any).delivery?.errorMessage || 'Unknown delivery error'}</span>} />
            )}
            {Array.isArray(order.items) && order.items.some((item: any) =>
              (item.productName || item.name || '').includes('P2P Fee')
            ) && (
              <div className="pt-2 border-t border-white/5 space-y-2">
                <span className="text-gray-400 text-sm font-medium">P2P Trade Details:</span>
                <div className="space-y-1.5">
                  {order.p2pToken && <DetailRow label="Token:" value={order.p2pToken} />}
                  {order.p2pNetwork && <DetailRow label="Network:" value={order.p2pNetwork} />}
                  {order.p2pWalletAddress && (
                    <DetailRow label="Wallet Address:" value={order.p2pWalletAddress} copyBtn={<CopyBtn fieldKey="p2p_wallet" value={order.p2pWalletAddress} />} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      {showDeliverModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Confirm Delivery</h3>
            <p className="text-gray-400 text-sm mb-4">Add a note for the customer (optional):</p>
            <textarea
              value={deliverNote}
              onChange={(e) => setDeliverNote(e.target.value)}
              placeholder="Delivery note..."
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:border-cyan-400/50 transition-colors"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowDeliverModal(false)}
                className="flex-1 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/5 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeliver}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium"
              >
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

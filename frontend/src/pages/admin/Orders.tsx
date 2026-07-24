import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import api from '../../lib/axios';
import {
  Order,
  OrderItem,
  ApiResponse,
  ApiPaginatedResponse,
  StatusBadge,
  PaymentMethodBadge,
  DetailRow,
  CopyBtn,
  formatDate,
  formatDateTime,
  formatPrice,
  normalizePaymentStatus,
  normalizeOrderStatus,
  compactOrderId,
  isCryptoOrder,
  getCustomerName,
  getProductName,
} from './components/OrderHelpers';

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
// Order Stats Interface
// ---------------------------------------------------------------------------
interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  deliveredOrders: number;
  rejectedOrders: number;
  todayOrders: number;
  revenueUSDT: number;
  revenueBDT: number;
  paymentMethods: { method: string; count: number }[];
}

// ---------------------------------------------------------------------------
// QuickInfo Component
// ---------------------------------------------------------------------------
function QuickInfo({ order }: { order: Order }) {
  const method = (order.payment_method || order.paymentMethod || '').toLowerCase();
  const paidVia = (order.paid_via || order.paidVia || '').toLowerCase();
  const compactBoxBase = 'px-2 py-1 rounded-md text-[11px] font-medium border';
  const viaBadgeClass = paidVia === 'uid'
    ? `${compactBoxBase} bg-cyan-500/15 border-cyan-400/30 text-cyan-200`
    : `${compactBoxBase} bg-violet-500/15 border-violet-400/30 text-violet-200`;
  const detailBadgeClass = paidVia === 'uid'
    ? `${compactBoxBase} bg-fuchsia-500/15 border-fuchsia-400/30 text-fuchsia-200`
    : `${compactBoxBase} bg-emerald-500/15 border-emerald-400/30 text-emerald-200`;
  const mobileBadgeClass = `${compactBoxBase} bg-blue-500/15 border-blue-400/30 text-blue-200`;

  if (method === 'paycrypto') {
    return (
      <div className="flex flex-wrap gap-1.5 max-w-[260px]">
        <span className={viaBadgeClass}>Via: {paidVia === 'uid' ? 'UID' : 'Network'}</span>
        {paidVia === 'network' ? (
          <span className={detailBadgeClass}>Net: {order.selected_network || order.selectedNetwork || '-'}</span>
        ) : (
          <span className={detailBadgeClass}>Platform: {order.selected_platform || order.selectedPlatform || '-'}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 max-w-[260px]">
      <span className={mobileBadgeClass}>Number: {order.payment_number || order.paymentNumber || '-'}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------
function LoadingSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 sm:p-6">
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="h-4 bg-white/10 rounded w-32" />
            <div className="h-4 bg-white/10 rounded w-28" />
            <div className="h-4 bg-white/10 rounded w-16" />
            <div className="h-6 bg-white/10 rounded-full w-20" />
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="h-8 bg-white/10 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Orders Page
// ---------------------------------------------------------------------------
const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'rejected', label: 'Rejected' },
] as const;

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliverOrderId, setDeliverOrderId] = useState<string | null>(null);
  const [deliverNote, setDeliverNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const actionBusyRef = useRef(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/admin/orders/stats');
      const json: ApiResponse<OrderStats> = res.data;
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch {
      // stats endpoint may not exist; silently ignore
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async (status: string = statusFilter, showLoading: boolean = false) => {
    if (showLoading) setLoading(true);
    try {
      const params: Record<string, string> = { limit: '100', source: 'checkout' };
      if (status !== 'all') params.status = status;
      const res = await api.get('/admin/orders', { params });
      const json: ApiPaginatedResponse<Order> = res.data;
      if (json.success && json.data) {
        setOrders(json.data);
      } else {
        setOrders([]);
      }
      if (json.pagination) {
        setTotal(json.pagination.total);
      }
    } catch {
      setOrders([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders(statusFilter, true);
    fetchStats();
    const interval = setInterval(() => {
      fetchOrders(statusFilter, false);
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    fetchOrders(status, true);
  };

  const handleStatusUpdated = async () => {
    await fetchOrders(statusFilter, true);
    fetchStats();
  };

  // ---- Actions ----
  const runAction = async (action: 'verify' | 'reject' | 'approve', orderId: string) => {
    if (actionBusyRef.current) return;
    actionBusyRef.current = true;
    setActionLoading(true);
    try {
      const actionMap: Record<string, string> = {
        verify: 'verify_payment',
        reject: 'reject_payment',
        approve: 'approve_order',
      };
      const res = await api.put(`/admin/orders/${orderId}`, { action: actionMap[action] });
      const json: ApiResponse<Order> = res.data;
      if (!json.success) {
        showToast(json.error || 'Failed to update order', 'error');
        return;
      }
      const messages: Record<string, string> = {
        verify: 'Payment verified successfully (gateway confirmed)',
        reject: 'Payment rejected',
        approve: 'Order approved successfully',
      };
      showToast(messages[action], 'success');
      handleStatusUpdated();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to update order', 'error');
    } finally {
      setActionLoading(false);
      actionBusyRef.current = false;
    }
  };

  // ---- View ----
  const handleViewOrder = (order: Order) => {
    navigate(`/admin/orders/details/${order.orderNumber || order._id}`);
  };

  // ---- Render ----
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Orders Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            {loading ? 'Loading...' : `${total} order${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-gray-400 text-sm">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-gray-800">
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchOrders(statusFilter, true)}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 mb-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4 animate-pulse">
              <div className="h-3 bg-white/10 rounded w-16 mb-3" />
              <div className="h-6 bg-white/10 rounded w-20" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold">Σ</span>
              <span className="text-blue-400 text-xs font-medium">Total</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.totalOrders.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-xl border border-amber-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 rounded-full bg-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold">!</span>
              <span className="text-amber-400 text-xs font-medium">Pending</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.pendingOrders}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 rounded-full bg-green-500/30 flex items-center justify-center text-green-400 text-xs font-bold">✓</span>
              <span className="text-green-400 text-xs font-medium">Approved</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.approvedOrders}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl border border-emerald-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">→</span>
              <span className="text-emerald-400 text-xs font-medium">Delivered</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.deliveredOrders}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl border border-red-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 rounded-full bg-red-500/30 flex items-center justify-center text-red-400 text-xs font-bold">✕</span>
              <span className="text-red-400 text-xs font-medium">Rejected</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.rejectedOrders}</p>
          </div>
          <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/10 rounded-xl border border-violet-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 rounded-full bg-violet-500/30 flex items-center justify-center text-violet-400 text-xs font-bold">T</span>
              <span className="text-violet-400 text-xs font-medium">Today</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.todayOrders}</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 rounded-xl border border-cyan-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 rounded-full bg-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-bold">$</span>
              <span className="text-cyan-400 text-xs font-medium">Revenue</span>
            </div>
            <p className="text-white text-xs leading-tight">
              <span className="block">${(stats.revenueUSDT || 0).toLocaleString()}</span>
              <span className="block text-cyan-400/70">৳{(stats.revenueBDT || 0).toLocaleString()}</span>
            </p>
          </div>
        </div>
      ) : null}

      {/* Orders Table */}
      {loading ? <LoadingSkeleton /> : (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-3 sm:p-4">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Orders</h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-white/10">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gradient-to-r from-blue-500/15 via-cyan-500/10 to-teal-500/15 backdrop-blur-sm">
                <tr className="border-b border-white/10">
                  <th className="text-left py-2.5 px-3 text-blue-200 font-semibold text-[10px] uppercase tracking-wider">Order ID</th>
                  <th className="text-left py-2.5 px-3 text-cyan-200 font-semibold text-[10px] uppercase tracking-wider">Product</th>
                  <th className="text-left py-2.5 px-3 text-fuchsia-200 font-semibold text-[10px] uppercase tracking-wider">Username</th>
                  <th className="text-left py-2.5 px-3 text-amber-200 font-semibold text-[10px] uppercase tracking-wider">Country</th>
                  <th className="text-left py-2.5 px-3 text-cyan-200 font-semibold text-[10px] uppercase tracking-wider">Payment Method</th>
                  <th className="text-left py-2.5 px-3 text-blue-200 font-semibold text-[10px] uppercase tracking-wider">Quick Info</th>
                  <th className="text-left py-2.5 px-3 text-emerald-200 font-semibold text-[10px] uppercase tracking-wider">Amount</th>
                  <th className="text-left py-2.5 px-3 text-amber-200 font-semibold text-[10px] uppercase tracking-wider">Payment Status</th>
                  <th className="text-left py-2.5 px-3 text-lime-200 font-semibold text-[10px] uppercase tracking-wider">Order Status</th>
                  <th className="text-left py-2.5 px-3 text-sky-200 font-semibold text-[10px] uppercase tracking-wider">Created At</th>
                  <th className="text-left py-2.5 px-3 text-rose-200 font-semibold text-[10px] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!orders.length && (
                  <tr>
                    <td colSpan={11} className="py-8 px-3 text-center text-gray-400 text-sm">
                      No orders found. New orders will appear here.
                    </td>
                  </tr>
                )}
                {orders.map((order) => {
                  const paymentMethod = (order.payment_method || order.paymentMethod || '').toLowerCase();
                  const paidVia = (order.paid_via || order.paidVia || '').toLowerCase();
                  const payStatus = normalizePaymentStatus(order);
                  const ordStatus = normalizeOrderStatus(order);

                  return (
                    <tr key={order._id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="py-2.5 px-3 text-white font-medium text-xs">
                        <div className="flex flex-col gap-1">
                          <span title={order.order_id || order.orderNumber || order._id}>
                            {compactOrderId(order.order_id || order.orderNumber || order._id)}
                          </span>
                          {(order.productCategory) && (
                            <span className="inline-flex w-fit px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {order.productCategory}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-300 text-xs max-w-[160px]">
                        <span className="truncate block" title={getProductName(order)}>{getProductName(order)}</span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-300 text-xs">{order.username || getCustomerName(order) || '-'}</td>
                      <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                        {order.countryFlag ? (
                          <span className="inline-flex items-center gap-1.5" title={order.country || order.countryCode || ''}>
                            <span className="text-lg leading-none">{order.countryFlag}</span>
                            <span className="text-gray-300">{order.countryCode || ''}</span>
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <PaymentMethodBadge method={order.payment_method || order.paymentMethod || '-'} />
                      </td>
                      <td className="py-2.5 px-3">
                        <QuickInfo order={order} />
                      </td>
                      <td className="py-2.5 px-3 text-white font-medium text-xs">
                        {formatPrice(order.amount ?? 0, order.currency)}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge type="payment" status={payStatus} />
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge type="order" status={ordStatus} />
                      </td>
                      <td className="py-2.5 px-3 text-gray-300 text-[11px] whitespace-nowrap">
                        {formatDate(order.created_at || order.createdAt || order.orderDate || '')}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="px-2 py-1 text-[10px] rounded bg-blue-600/80 hover:bg-blue-600 text-white transition-colors"
                            title="View Order"
                          >
                            View
                          </button>
                          {payStatus === 'verified' && !['delivered', 'rejected'].includes(ordStatus) && (
                            <button
                              onClick={() => {
                                setDeliverOrderId(order._id);
                                setDeliverNote('');
                                setShowDeliverModal(true);
                              }}
                              disabled={actionLoading || actionBusyRef.current}
                              className="px-1.5 py-1 text-[10px] rounded bg-red-600/80 hover:bg-red-600 text-white disabled:opacity-50"
                              title="Deliver Order"
                            >
                              Deliver
                            </button>
                          )}
                          {payStatus !== 'verified' && !['delivered', 'rejected'].includes(ordStatus) && (
                            <>
                              <button
                                onClick={() => runAction('verify', order._id)}
                                disabled={actionLoading || payStatus === 'verified' || payStatus === 'rejected'}
                                className="px-1.5 py-1 text-[10px] rounded bg-green-600/80 hover:bg-green-600 text-white disabled:opacity-50"
                                title="Verify Payment"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => runAction('reject', order._id)}
                                disabled={actionLoading || payStatus === 'rejected'}
                                className="px-1.5 py-1 text-[10px] rounded bg-red-600/80 hover:bg-red-600 text-white disabled:opacity-50"
                                title="Reject Payment"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      {showDeliverModal && deliverOrderId && (
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
                onClick={async () => {
                  setShowDeliverModal(false);
                  if (actionBusyRef.current) return;
                  actionBusyRef.current = true;
                  setActionLoading(true);
                  try {
                    const res = await api.put(`/admin/orders/${deliverOrderId}`, {
                      action: 'deliver_order',
                      deliveryNote: deliverNote.trim() || undefined,
                    });
                    const json: ApiResponse<Order> = res.data;
                    if (!json.success) {
                      showToast(json.error || 'Failed to deliver order', 'error');
                      return;
                    }
                    showToast('Order delivered successfully', 'success');
                    handleStatusUpdated();
                  } catch (err: any) {
                    showToast(err?.response?.data?.error || 'Failed to deliver order', 'error');
                  } finally {
                    setActionLoading(false);
                    actionBusyRef.current = false;
                  }
                }}
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

import { Check, Copy } from 'lucide-react';
import { formatPrice as fp } from '../../../utils/formatPrice';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface OrderItem {
  productName?: string;
  name?: string;
  quantity?: number;
  price?: number;
  link?: string;
  smmServiceId?: string;
  smmOrderId?: string;
  details?: string;
  usdtAmount?: number;
  [key: string]: any;
}

export interface Order {
  _id: string;
  orderNumber?: string;
  order_id?: string;
  customer?: { name?: string } | string;
  product?: { name?: string; _id?: string } | string;
  username?: string;
  email?: string;
  product_id?: string;
  product_name?: string;
  productName?: string;
  productCategory?: string;
  product_category?: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  payment_method?: string;
  paymentNumber?: string;
  payment_number?: string;
  transactionId?: string;
  transaction_id?: string;
  paymentStatus?: string;
  payment_status?: string;
  currency?: string;
  created_at?: string;
  createdAt?: string;
  orderDate?: string;
  notes?: string;
  deliveryNote?: string;
  items?: OrderItem[];
  countryFlag?: string;
  country?: string;
  countryCode?: string;
  ipAddress?: string;
  captchaApiKey?: string;
  delivery?: {
    provider?: string;
    status?: 'pending' | 'completed' | 'failed' | '';
    externalReference?: string;
    errorMessage?: string;
    deliveredAt?: string;
  };
  // crypto fields
  cryptoCurrency?: string;
  crypto_currency?: string;
  paidVia?: string;
  paid_via?: string;
  selectedNetwork?: string;
  selected_network?: string;
  selectedPlatform?: string;
  selected_platform?: string;
  walletAddress?: string;
  wallet_address?: string;
  senderUid?: string;
  sender_uid?: string;
  txHash?: string;
  // P2P fields
  p2pToken?: string;
  p2pNetwork?: string;
  p2pWalletAddress?: string;
  [key: string]: any;
}

export interface ApiPaginatedResponse<T> {
  success: boolean;
  data?: T[];
  error?: string;
  message?: string;
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function getCustomerName(order: Order): string {
  if (typeof order.customer === 'object' && order.customer !== null) {
    return (order.customer as { name?: string }).name || 'Unknown';
  }
  return 'Unknown';
}

export function getProductName(order: Order): string {
  if (order.product_name) return order.product_name;
  if (order.productName) return order.productName;
  // Check items array for productName (covers legacy orders)
  if (order.items && order.items.length > 0 && order.items[0].productName) {
    return order.items[0].productName;
  }
  if (typeof order.product === 'object' && order.product !== null) {
    return (order.product as { name?: string }).name || 'Unknown';
  }
  return 'Unknown';
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const date = d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Dhaka',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka',
  });
  return `${date}, ${time} BD`;
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function getCurrencySymbol(currency?: string): string {
  return currency === 'USDT' ? '$' : '৳';
}

export function formatPrice(price: number, currency?: string): string {
  return `${getCurrencySymbol(currency)}${fp(price, 2)}`;
}

export function normalizePaymentStatus(order: Order): string {
  return (order.payment_status || order.paymentStatus || 'pending').toLowerCase();
}

export function normalizeOrderStatus(order: Order): string {
  return (order.status || 'pending').toLowerCase();
}

export function compactOrderId(orderId: string) {
  if (!orderId) return '-';
  if (orderId.length <= 18) return orderId;
  return `${orderId.slice(0, 10)}...${orderId.slice(-5)}`;
}

export function isCryptoOrder(order: Order): boolean {
  return (order.payment_method || order.paymentMethod || '').toLowerCase() === 'paycrypto';
}

// ---------------------------------------------------------------------------
// Status Badges
// ---------------------------------------------------------------------------
import { Clock3, CheckCircle2, Truck, XCircle } from 'lucide-react';

export function StatusBadge({ type, status }: { type: 'payment' | 'order'; status: string }) {
  const normalized = (status || '').toLowerCase();
  let cls = 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  let label = normalized || 'unknown';
  let Icon = Clock3;

  if (normalized === 'pending') {
    cls = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    label = 'Pending';
    Icon = Clock3;
  } else if (normalized === 'verified' || normalized === 'approved') {
    cls = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    label = normalized === 'verified' ? 'Verified' : 'Approved';
    Icon = CheckCircle2;
  } else if (normalized === 'rejected') {
    cls = 'bg-red-500/20 text-red-300 border-red-500/30';
    label = 'Rejected';
    Icon = XCircle;
  } else if (normalized === 'delivered') {
    cls = 'bg-green-500/20 text-green-300 border-green-500/30';
    label = 'Delivered';
    Icon = Truck;
  } else if (normalized === 'paid') {
    cls = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    label = 'Paid';
    Icon = CheckCircle2;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

export function PaymentMethodBadge({ method }: { method: string }) {
  const normalized = (method || '').toLowerCase();
  let cls = 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  let label = method || 'Unknown';

  if (normalized === 'paycrypto') {
    cls = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    label = 'CRYPTO';
  } else if (normalized === 'bkash') {
    cls = 'bg-pink-500/20 text-pink-300 border-pink-500/30';
    label = 'bKash';
  } else if (normalized === 'nagad') {
    cls = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    label = 'Nagad';
  } else if (normalized) {
    label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Copy Button
// ---------------------------------------------------------------------------
export function CopyBtn({ fieldKey, value }: { fieldKey: string; value: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!value || value === '-') return;
        navigator.clipboard.writeText(value).catch(() => {});
      }}
      className="ml-2 mt-1 sm:mt-0 shrink-0 inline-flex items-center justify-center w-7 h-7 sm:w-6 sm:h-6 rounded bg-white/10 hover:bg-white/20 text-gray-300"
      title="Copy"
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// DetailRow
// ---------------------------------------------------------------------------
export function DetailRow({ label, value, copyBtn }: { label: React.ReactNode; value: React.ReactNode; copyBtn?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between">
      <span className="text-gray-400 mb-1 sm:mb-0">{label}</span>
      <span className="text-white text-right break-all inline-flex items-center flex-wrap justify-end">
        {value}
        {copyBtn}
      </span>
    </div>
  );
}

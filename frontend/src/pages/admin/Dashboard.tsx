import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, ShoppingCart, Package, UserPlus, TrendingUp, Eye, Edit, Trash2,
  MoreVertical, Settings, CheckCircle2, Clock3, Truck, XCircle
} from 'lucide-react';
import api from '../../lib/axios';
import EnhancedAlert from '../../components/public/EnhancedAlert';
import type { AlertConfig } from '../../components/public/EnhancedAlert';
import { devLog } from '../../utils/devLogger';
import { formatPrice } from '../../utils/formatPrice';

interface Order {
  _id?: string;
  id?: string;
  orderNumber?: string;
  username?: string;
  customer?: { name: string; email: string } | string;
  product?: { name: string } | string;
  productName?: string;
  amount: number;
  status: string;
  createdAt?: string;
  currency?: string;
  items?: Array<{ productName?: string; price?: number; usdtAmount?: number }>;
}

interface Product {
  _id?: string;
  name: string;
  price: number;
  priceUSDT?: number;
  priceBDT?: number;
  sales: number;
  revenue: number | string;
  trend: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [revenueChange, setRevenueChange] = useState('+0%');
  const [ordersChange, setOrdersChange] = useState('+0%');
  const [productsChange, setProductsChange] = useState('+0%');
  const [customersChange, setCustomersChange] = useState('+0%');
  const [bdtRevenue, setBdtRevenue] = useState(0);
  const [bdtRevenueChange, setBdtRevenueChange] = useState('+0%');
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState({ usdt: 0, bdt: 0 });
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await api.get('/stats/dashboard');
      const d = res.data;
      if (d.success && d.data?.stats) {
        const revenueUsdt = d.data.stats.find((s: any) => s.title === 'Revenue USDT');
        const revenueBdt = d.data.stats.find((s: any) => s.title === 'Revenue BDT');
        const orders = d.data.stats.find((s: any) => s.title === 'Total Orders');
        const products = d.data.stats.find((s: any) => s.title === 'Total Products');
        const customers = d.data.stats.find((s: any) => s.title === 'Total Customers');
        const todayStats = d.data.stats.find((s: any) => s.title === "Today's Orders");

        setTotalRevenue(Number(String(revenueUsdt?.value || '0').replace(/[$,]/g, '')) || 0);
        setBdtRevenue(Number(String(revenueBdt?.value || '0').replace(/[৳,]/g, '')) || 0);
        setTotalOrders(Number(String(orders?.value || '0').replace(/[,]/g, '')) || 0);
        setTotalProductsCount(Number(String(products?.value || '0').replace(/[,]/g, '')) || 0);
        setTotalCustomers(Number(String(customers?.value || '0').replace(/[,]/g, '')) || 0);
        setRevenueChange(revenueUsdt?.change || '+0%');
        setBdtRevenueChange(revenueBdt?.change || '+0%');
        setOrdersChange(orders?.change || '+0%');
        setProductsChange(products?.change || '+0%');
        setCustomersChange(customers?.change || '+0%');

        if (todayStats) {
          setTodayOrdersCount(Number(todayStats.value) || 0);
          // Parse sub string like "$xx.xx / ৳xx.xx"
          const sub = todayStats.sub || '';
          const usdtMatch = sub.match(/\$([\d.]+)/);
          const bdtMatch = sub.match(/৳([\d.]+)/);
          setTodayRevenue({
            usdt: usdtMatch ? parseFloat(usdtMatch[1]) : 0,
            bdt: bdtMatch ? parseFloat(bdtMatch[1]) : 0,
          });
        }

        if (Array.isArray(d.data.recentOrders)) setRecentOrders(d.data.recentOrders);
        if (Array.isArray(d.data.topProducts)) setTopProducts(d.data.topProducts);
      }
    } catch (err) {
      devLog('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'verified':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'delivered':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'refunded':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setShowEditModal(true);
  };

  const handleDeleteOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedOrder?._id) return;
    try {
      const res = await api.delete(`/admin/orders/${selectedOrder._id}`);
      if (res.data.success) {
        window.location.reload();
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: `Failed to delete: ${res.data.error}` });
      }
    } catch {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to delete order' });
    } finally {
      setShowDeleteModal(false);
      setSelectedOrder(null);
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder?._id) return;
    try {
      const res = await api.put(`/admin/orders/${selectedOrder._id}`, { status: editStatus });
      if (res.data.success) {
        window.location.reload();
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: `Failed to update: ${res.data.error}` });
      }
    } catch {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to update order' });
    } finally {
      setShowEditModal(false);
      setSelectedOrder(null);
    }
  };

  const handleViewAllOrders = () => {
    navigate('/admin/orders');
  };

  const handleAddProduct = () => {
    navigate('/admin/products');
  };

  const handleSettings = () => {
    navigate('/admin/settings');
  };

  const stats = [
    { title: 'Revenue (USDT)', value: `$${totalRevenue.toLocaleString()}`, change: revenueChange, icon: DollarSign, bgColor: 'bg-gradient-to-br from-green-500 to-emerald-600' },
    { title: 'Revenue (BDT)', value: `৳${bdtRevenue.toLocaleString()}`, change: bdtRevenueChange || '+0%', icon: DollarSign, bgColor: 'bg-gradient-to-br from-green-500 to-emerald-600' },
    { title: 'Total Orders', value: totalOrders.toLocaleString(), change: ordersChange, icon: ShoppingCart, bgColor: 'bg-gradient-to-br from-blue-500 to-cyan-600' },
    { title: 'Total Products', value: totalProductsCount.toLocaleString(), change: productsChange, icon: Package, bgColor: 'bg-gradient-to-br from-blue-500 to-cyan-600' },
    { title: 'Total Customers', value: totalCustomers.toLocaleString(), change: customersChange, icon: UserPlus, bgColor: 'bg-gradient-to-br from-orange-500 to-red-600' },
    { title: "Today's Orders", value: todayOrdersCount.toString(), change: todayRevenue.usdt > 0 || todayRevenue.bdt > 0 ? 'Active' : '0', icon: TrendingUp, bgColor: 'bg-gradient-to-br from-cyan-500 to-teal-600', sub: todayRevenue.usdt > 0 || todayRevenue.bdt > 0 ? `$${formatPrice(todayRevenue.usdt, 2)} / ৳${formatPrice(todayRevenue.bdt, 2)}` : undefined },
  ];

  const cardBgMap: Record<string, string> = {
    'bg-gradient-to-br from-green-500 to-emerald-600': 'bg-gradient-to-br from-green-500/10 to-emerald-600/10',
    'bg-gradient-to-br from-blue-500 to-cyan-600': 'bg-gradient-to-br from-blue-500/10 to-cyan-600/10',
    'bg-gradient-to-br from-orange-500 to-red-600': 'bg-gradient-to-br from-orange-500/10 to-red-600/10',
    'bg-gradient-to-br from-cyan-500 to-teal-600': 'bg-gradient-to-br from-cyan-500/10 to-teal-600/10',
  };

  const cardHoverMap: Record<string, string> = {
    'bg-gradient-to-br from-green-500 to-emerald-600': 'hover:bg-gradient-to-br hover:from-green-500/20 hover:to-emerald-600/20',
    'bg-gradient-to-br from-blue-500 to-cyan-600': 'hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-cyan-600/20',
    'bg-gradient-to-br from-orange-500 to-red-600': 'hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-red-600/20',
    'bg-gradient-to-br from-cyan-500 to-teal-600': 'hover:bg-gradient-to-br hover:from-cyan-500/20 hover:to-teal-600/20',
  };

  const getCustomerName = (customer: Order['customer']) => {
    if (typeof customer === 'string') return customer;
    return customer?.name || 'Guest';
  };

  const getRowCustomerName = (order: Order) => {
    if (order.username) return order.username;
    if (typeof order.customer === 'string') return order.customer;
    return order.customer?.name || 'Guest';
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const normalized = (status || '').toLowerCase();
    let cls = 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    let label = status || 'Unknown';
    let Icon = Clock3;

    if (normalized === 'pending') {
      cls = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      label = 'Pending';
      Icon = Clock3;
    } else if (normalized === 'approved' || normalized === 'verified' || normalized === 'completed') {
      cls = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      label = normalized === 'verified' ? 'Verified' : normalized === 'completed' ? 'Completed' : 'Approved';
      Icon = CheckCircle2;
    } else if (normalized === 'delivered') {
      cls = 'bg-green-500/20 text-green-300 border-green-500/30';
      label = 'Delivered';
      Icon = Truck;
    } else if (normalized === 'rejected' || normalized === 'cancelled') {
      cls = 'bg-red-500/20 text-red-300 border-red-500/30';
      label = normalized === 'cancelled' ? 'Cancelled' : 'Rejected';
      Icon = XCircle;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  };

  const getProductName = (product: Order['product'], productName?: string, order?: Order) => {
    if (productName) return productName;
    // Check items array (covers legacy orders without root productName)
    if (order?.items && order.items.length > 0 && (order.items[0] as any).productName) {
      return (order.items[0] as any).productName;
    }
    if (typeof product === 'string') return product;
    return product?.name || 'Unknown';
  };

  const getCurrencySym = (currency?: string) => currency === 'USDT' ? '$' : '৳';

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toISOString().split('T')[0];
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 sm:p-6 animate-pulse">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl" />
                <div className="w-14 sm:w-16 h-4 sm:h-5 bg-white/10 rounded-full" />
              </div>
              <div className="h-6 sm:h-8 bg-white/10 rounded w-20 sm:w-24 mb-1" />
              <div className="h-3 sm:h-4 bg-white/5 rounded w-12 sm:w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 sm:p-6 animate-pulse">
            <div className="h-5 sm:h-6 bg-white/10 rounded w-32 sm:w-40 mb-4 sm:mb-6" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 sm:h-10 bg-white/5 rounded mb-2 sm:mb-3" />
            ))}
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 sm:p-6 animate-pulse">
            <div className="h-5 sm:h-6 bg-white/10 rounded w-24 sm:w-32 mb-4 sm:mb-6" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 sm:h-12 bg-white/5 rounded mb-2 sm:mb-3" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {alertConfig && <EnhancedAlert {...alertConfig} onClose={() => setAlertConfig(null)} />}
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`${cardBgMap[stat.bgColor] || 'bg-white/5'} backdrop-blur-lg rounded-xl border ${stat.bgColor.includes('green') ? 'border-green-500/20' : stat.bgColor.includes('blue') ? 'border-blue-500/20' : stat.bgColor.includes('orange') ? 'border-orange-500/20' : stat.bgColor.includes('cyan') ? 'border-cyan-500/20' : 'border-white/10'} p-4 sm:p-6 ${cardHoverMap[stat.bgColor] || 'hover:bg-white/10'} transition-all`}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`p-2 sm:p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-green-400 text-xs sm:text-sm font-medium">{stat.change}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">{stat.value}</h3>
            <p className="text-gray-400 text-xs sm:text-sm">{stat.title}</p>
            {(stat as any).sub && (
              <p className="text-gray-500 text-[10px] mt-1">{(stat as any).sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-bold text-white">Recent Orders</h3>
                <p className="text-xs text-gray-400">Latest transactions</p>
              </div>
            </div>
            <button
              onClick={handleViewAllOrders}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900/80 hover:bg-gray-800 rounded-xl border border-gray-700 transition-all"
            >
              View All
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-400">
              <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
              <p>No orders yet</p>
            </div>
          ) : (
            <>
              {/* Mobile Order Cards */}
              <div className="block sm:hidden space-y-3">
                {recentOrders.map((order) => (
                  <div key={order._id || order.id} className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium text-xs">{order.orderNumber || order.id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Customer:</span>
                      <span className="text-gray-200">{getRowCustomerName(order)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Product:</span>
                      <span className="text-gray-200">{getProductName(order.product, order.productName, order)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-medium">{getCurrencySym(order.currency)}{formatPrice(Number(order.amount), 2)}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <button onClick={() => handleViewOrder(order)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-gray-400 hover:text-blue-400 bg-white/5 hover:bg-blue-500/10 rounded-lg text-xs transition-all">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button onClick={() => handleDeleteOrder(order)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg text-xs transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2.5 px-3 text-gray-400 font-medium text-xs">Order ID</th>
                      <th className="text-left py-2.5 px-3 text-gray-400 font-medium text-xs">Customer</th>
                      <th className="text-left py-2.5 px-3 text-gray-400 font-medium text-xs">Product</th>
                      <th className="text-left py-2.5 px-3 text-gray-400 font-medium text-xs">Amount</th>
                      <th className="text-left py-2.5 px-3 text-gray-400 font-medium text-xs">Status</th>
                      <th className="text-left py-2.5 px-3 text-gray-400 font-medium text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id || order.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="py-2.5 px-3 text-white font-medium text-xs">{order.orderNumber || order.id}</td>
                        <td className="py-2.5 px-3 text-gray-300 text-xs">{getRowCustomerName(order)}</td>
                        <td className="py-2.5 px-3 text-gray-300 text-xs">{getProductName(order.product, order.productName, order)}</td>
                        <td className="py-2.5 px-3 text-white font-medium text-xs">{getCurrencySym(order.currency)}{formatPrice(Number(order.amount), 2)}</td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleViewOrder(order)} className="p-1 text-gray-400 hover:text-blue-400 transition-all hover:scale-110" title="View Order">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteOrder(order)} className="p-1 text-gray-400 hover:text-red-400 transition-all hover:scale-110" title="Delete Order">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-bold text-white">Top Products</h3>
                <p className="text-xs text-gray-400">Best sellers</p>
              </div>
            </div>
            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-400">
              <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
              <p>No products yet</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {topProducts.slice(0, 5).map((product, index) => (
                <div key={product._id || index} className="group flex items-center justify-between p-2.5 sm:p-3 bg-white/5 rounded-xl hover:bg-white/10 border border-transparent hover:border-blue-500/20 transition-all overflow-hidden">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-xs sm:text-sm font-bold text-blue-400 shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-xs sm:text-sm truncate group-hover:text-blue-300 transition-colors">{product.name}</p>
                      <p className="text-gray-500 text-xs">{product.sales} sales · <span className="text-gray-400">${formatPrice(product.price || 0, 2)}</span></p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-white font-bold text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[120px]">
                      {typeof product.revenue === 'number' ? `$${formatPrice(product.revenue, 0)}` : product.revenue}
                    </p>
                    <p className="text-green-400 text-xs flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full shrink-0"></span>
                      <span className="truncate max-w-[80px]">{product.trend}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-bold text-white">Quick Actions</h3>
            <p className="text-xs text-gray-400">Shortcuts to common tasks</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={handleAddProduct}
            className="group flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl transition-all"
          >
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mb-2 sm:mb-3 shadow-lg shadow-blue-500/30 transition-all">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-white font-medium text-xs sm:text-sm">Add Product</span>
            <span className="text-gray-500 text-xs mt-0.5 sm:mt-1">New item</span>
          </button>
          <button
            onClick={handleSettings}
            className="group flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl transition-all"
          >
            <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl mb-2 sm:mb-3 shadow-lg shadow-orange-500/30 transition-all">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-white font-medium text-xs sm:text-sm">Settings</span>
            <span className="text-gray-500 text-xs mt-0.5 sm:mt-1">Configure</span>
          </button>
        </div>
      </div>

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Order Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID:</span>
                <span className="text-white font-medium">{selectedOrder.orderNumber || selectedOrder._id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Customer:</span>
                <span className="text-white">{selectedOrder.username || getCustomerName(selectedOrder.customer)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Product:</span>
                <span className="text-white">{getProductName(selectedOrder.product, selectedOrder.productName)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-medium">{getCurrencySym(selectedOrder.currency)}{formatPrice(Number(selectedOrder.amount), 2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Created:</span>
                <span className="text-white text-sm">{formatDate(selectedOrder.createdAt)}</span>
              </div>
            </div>
            <button onClick={() => setShowViewModal(false)} className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/20 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Edit Order</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="pending" className="bg-slate-900">Pending</option>
                  <option value="processing" className="bg-slate-900">Processing</option>
                  <option value="completed" className="bg-slate-900">Completed</option>
                  <option value="cancelled" className="bg-slate-900">Cancelled</option>
                  <option value="refunded" className="bg-slate-900">Refunded</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleUpdateOrder} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/20 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Delete Order</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete order {selectedOrder.orderNumber || selectedOrder._id}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

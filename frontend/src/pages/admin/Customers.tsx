import { useEffect, useState } from 'react';
import { X, Ban, Shield, Users, UserCheck, UserX, TrendingUp, DollarSign, Wallet, Mail, Phone, MapPin, Calendar, ShoppingBag } from 'lucide-react';
import api from '../../lib/axios';
import { formatPrice } from '../../utils/formatPrice';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  totalOrders?: number;
  totalSpentUSDT?: number;
  totalSpentBDT?: number;
  registeredAt?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  statusInfo?: { label: string };
}

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  suspendedCustomers: number;
  newCustomers30d: number;
  revenueUSDT: number;
  revenueBDT: number;
}

function getStatusStyle(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'suspended': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function ViewCustomerModal({ showModal, setShowModal, customer }: { showModal: boolean; setShowModal: (v: boolean) => void; customer: Customer | null }) {
  if (!showModal || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl w-full max-w-sm sm:max-w-lg max-h-[95vh] overflow-hidden">
        <div className="sticky top-0 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-white/20 p-4 sm:p-6 flex items-center justify-between shadow-lg">
          <h3 className="text-lg sm:text-2xl font-bold text-white">Customer Details</h3>
          <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              {customer.avatar ? (
                <img src={customer.avatar} alt={customer.name} className="w-full h-full rounded-xl sm:rounded-2xl object-cover" />
              ) : (
                <span className="text-white text-lg sm:text-2xl font-bold">
                  {customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg sm:text-2xl font-bold text-white truncate">{customer.name}</h4>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mt-2 space-y-1 sm:space-y-0">
                <span className="text-gray-400 text-xs sm:text-sm flex items-center">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Since {formatDate(customer.registeredAt)}
                </span>
                <span className={`px-2 sm:px-3 py-1 text-xs rounded-full font-semibold inline-block ${getStatusStyle(customer.status)}`}>
                  {customer.statusInfo?.label || customer.status}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <h5 className="text-lg sm:text-xl font-semibold text-white flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Contact Information
            </h5>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                <div className="p-2 bg-blue-500/20 rounded-lg sm:rounded-xl flex-shrink-0">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-xs sm:text-sm font-medium mb-1">Email Address</p>
                  <p className="text-white font-medium text-sm sm:text-base break-words">{customer.email}</p>
                </div>
              </div>
              {customer.phone && (
                <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                  <div className="p-2 bg-green-500/20 rounded-lg sm:rounded-xl flex-shrink-0">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-400 text-xs sm:text-sm font-medium mb-1">Phone Number</p>
                    <p className="text-white font-medium text-sm sm:text-base">{customer.phone}</p>
                  </div>
                </div>
              )}
              {customer.address?.city && (
                <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                  <div className="p-2 bg-blue-500/20 rounded-lg sm:rounded-xl flex-shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-400 text-xs sm:text-sm font-medium mb-1">Address</p>
                    <p className="text-white font-medium text-sm sm:text-base break-words">
                      {[customer.address.street, customer.address.city, customer.address.state, customer.address.zipCode, customer.address.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <h5 className="text-lg sm:text-xl font-semibold text-white flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Order Statistics
            </h5>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                <div className="p-2 bg-amber-500/20 rounded-lg sm:rounded-xl flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-xs sm:text-sm font-medium mb-1">Total Orders</p>
                  <p className="text-white font-medium text-base sm:text-lg">{customer.totalOrders || 0}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                <div className="p-2 bg-emerald-500/20 rounded-lg sm:rounded-xl flex-shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-xs sm:text-sm font-medium mb-1">Total Spent</p>
                  <p className="text-white font-medium text-base sm:text-lg">
                    {(customer.totalSpentUSDT || 0) > 0 && <>${formatPrice(Number(customer.totalSpentUSDT), 2)}</>}
                    {(customer.totalSpentBDT || 0) > 0 && (
                      <>{(customer.totalSpentUSDT || 0) > 0 && <span className="mx-1 text-gray-500">|</span>}৳{formatPrice(Number(customer.totalSpentBDT), 2)}</>
                    )}
                    {!(customer.totalSpentUSDT || 0) && !(customer.totalSpentBDT || 0) && <>$0.00</>}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                <div className="p-2 bg-indigo-500/20 rounded-lg sm:rounded-xl flex-shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-xs sm:text-sm font-medium mb-1">Registered At</p>
                  <p className="text-white font-medium text-sm sm:text-base">{formatDate(customer.registeredAt)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-white/20">
            <button onClick={() => setShowModal(false)} className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/10 text-white rounded-xl sm:rounded-2xl hover:bg-white/20 transition-all duration-200 font-medium text-base sm:text-lg shadow-lg">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditCustomerModal({ showModal, setShowModal, customer, onSave }: { showModal: boolean; setShowModal: (v: boolean) => void; customer: Customer | null; onSave?: (c: Partial<Customer>) => void }) {
  if (!showModal || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const updatedCustomer: Partial<Customer> = {
      name: `${formData.get('firstName')} ${formData.get('lastName')}`.trim() || undefined,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: {
        city: formData.get('city') as string,
        country: formData.get('country') as string,
      },
      status: formData.get('status') as Customer['status'],
    };
    onSave?.(updatedCustomer);
    setShowModal(false);
  };

  const [firstName, lastName = ''] = customer.name.split(' ');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl w-full max-w-sm sm:max-w-lg max-h-[95vh] overflow-hidden">
        <div className="sticky top-0 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-white/20 p-4 sm:p-6 flex items-center justify-between shadow-lg">
          <div>
            <h3 className="text-lg sm:text-2xl font-bold text-white">Edit Customer</h3>
            <p className="text-blue-400 text-sm mt-1">{customer._id}</p>
          </div>
          <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">First Name</label>
              <input type="text" name="firstName" defaultValue={firstName || ''} placeholder="John" className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">Last Name</label>
              <input type="text" name="lastName" defaultValue={lastName || ''} placeholder="Doe" className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">Email Address</label>
            <input type="email" name="email" defaultValue={customer.email} placeholder="john.doe@email.com" className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" required />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">Phone Number</label>
            <input type="tel" name="phone" defaultValue={customer.phone || ''} placeholder="+880 1XXX-XXXXXX" className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">City</label>
              <input type="text" name="city" defaultValue={customer.address?.city || ''} placeholder="Dhaka" className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">Country</label>
              <input type="text" name="country" defaultValue={customer.address?.country || ''} placeholder="Bangladesh" className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">Status</label>
            <select name="status" defaultValue={customer.status} className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
              <option value="active" className="bg-slate-900">Active</option>
              <option value="inactive" className="bg-slate-900">Inactive</option>
              <option value="suspended" className="bg-slate-900">Suspended</option>
            </select>
          </div>
          <div className="flex flex-col space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-white/20">
            <button type="button" onClick={() => setShowModal(false)} className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/10 text-white rounded-xl sm:rounded-2xl hover:bg-white/20 transition-all duration-200 font-medium text-base sm:text-lg shadow-lg">Cancel</button>
            <button type="submit" className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium text-base sm:text-lg shadow-xl">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 sm:p-6">
      <div className="mb-6"><div className="h-8 bg-white/10 rounded w-48 animate-pulse" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6 animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-14 h-14 bg-white/10 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-24" />
                <div className="h-3 bg-white/10 rounded w-40" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="h-14 bg-white/10 rounded-xl" />
              <div className="h-14 bg-white/10 rounded-xl" />
            </div>
            <div className="flex space-x-2">
              <div className="h-8 bg-white/10 rounded-xl flex-1" />
              <div className="h-8 bg-white/10 rounded-xl flex-1" />
              <div className="h-8 bg-white/10 rounded-xl flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 sm:p-6">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">No customers found</h3>
        <p className="text-gray-400 text-sm">Customers will appear here once they register or place orders.</p>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showViewCustomerModal, setShowViewCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { params: { limit: 100 } });
      if (res.data.success && res.data.data) {
        setCustomers(res.data.data);
      } else {
        setCustomers([]);
      }
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/admin/customers/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, []);

  const handleBanCustomer = async (customerId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      const res = await api.put(`/customers/${customerId}`, { status: newStatus });
      if (res.data.success && res.data.data) {
        setCustomers((prev) => prev.map((c) => (c._id === customerId ? res.data.data as Customer : c)));
      }
    } catch {
      // ignore
    }
  };

  const handleEditSave = async (updatedCustomer: Partial<Customer>) => {
    if (!selectedCustomer || !selectedCustomer._id) return;
    try {
      const res = await api.put(`/customers/${selectedCustomer._id}`, updatedCustomer);
      if (res.data.success && res.data.data) {
        setCustomers((prev) => prev.map((c) => (c._id === selectedCustomer._id ? res.data.data as Customer : c)));
      }
    } catch {
      // ignore
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewCustomerModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditCustomerModal(true);
  };

  const handleBanToggle = async (customer: Customer) => {
    if (customer.status === 'active') {
      if (!window.confirm(`Are you sure you want to suspend customer "${customer.name}"?`)) return;
      handleBanCustomer(customer._id, 'suspended');
    } else if (customer.status === 'suspended') {
      if (!window.confirm(`Are you sure you want to reactivate customer "${customer.name}"?`)) return;
      handleBanCustomer(customer._id, 'active');
    } else if (customer.status === 'inactive') {
      if (!window.confirm(`Are you sure you want to activate customer "${customer.name}"?`)) return;
      handleBanCustomer(customer._id, 'active');
    }
  };

  return (
    <>
      {loading ? (
        <LoadingSkeleton />
      ) : !customers.length ? (
        <>
          {statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4 animate-pulse"><div className="h-3 bg-white/10 rounded w-16 mb-3" /><div className="h-6 bg-white/10 rounded w-20" /></div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-4">
                <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-blue-400" /><span className="text-blue-400 text-xs font-medium">Total</span></div>
                <p className="text-white text-xl sm:text-2xl font-bold">{stats.totalCustomers.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl border border-emerald-500/20 p-4">
                <div className="flex items-center gap-2 mb-2"><UserCheck className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400 text-xs font-medium">Active</span></div>
                <p className="text-white text-xl sm:text-2xl font-bold">{stats.activeCustomers.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl border border-red-500/20 p-4">
                <div className="flex items-center gap-2 mb-2"><UserX className="w-4 h-4 text-red-400" /><span className="text-red-400 text-xs font-medium">Suspended</span></div>
                <p className="text-white text-xl sm:text-2xl font-bold">{stats.suspendedCustomers.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20 p-4">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-purple-400" /><span className="text-purple-400 text-xs font-medium">New (30d)</span></div>
                <p className="text-white text-xl sm:text-2xl font-bold">{stats.newCustomers30d.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 rounded-xl border border-cyan-500/20 p-4">
                <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-cyan-400" /><span className="text-cyan-400 text-xs font-medium">Revenue USDT</span></div>
                <p className="text-white text-xl sm:text-2xl font-bold">${Number(stats.revenueUSDT).toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-xl border border-amber-500/20 p-4">
                <div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-amber-400" /><span className="text-amber-400 text-xs font-medium">Revenue BDT</span></div>
                <p className="text-white text-xl sm:text-2xl font-bold">৳{Number(stats.revenueBDT).toLocaleString()}</p>
              </div>
            </div>
          ) : null}
          <EmptyState />
        </>
      ) : (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 sm:p-6">
          <div className="mb-6"><h2 className="text-xl sm:text-2xl font-bold text-white">Customers Management</h2></div>
          {statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4 animate-pulse"><div className="h-3 bg-white/10 rounded w-16 mb-3" /><div className="h-6 bg-white/10 rounded w-20" /></div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-4">
                <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-blue-400" /><span className="text-blue-400 text-xs font-medium">Total</span></div>
                <p className="text-white text-xl sm:text-2xl font-bold">{stats.totalCustomers.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl border border-emerald-500/20 p-4">
                <div className="flex items-center gap-2 mb-2"><UserCheck className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400 text-xs font-medium">Active</span></div>
                <p className="text-white text-xl sm:text-2xl font-bold">{stats.activeCustomers.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl border border-red-500/20 p-4">
                <div className="flex items-center gap-2 mb-2"><UserX className="w-4 h-4 text-red-400" /><span className="text-red-400 text-xs font-medium">Suspended</span></div>
                <p className="text-white text-xl sm:text-2xl font-bold">{stats.suspendedCustomers.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20 p-4">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-purple-400" /><span className="text-purple-400 text-xs font-medium">New (30d)</span></div>
                <p className="text-white text-xl sm:text-2xl font-bold">{stats.newCustomers30d.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 rounded-xl border border-cyan-500/20 p-4">
                <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-cyan-400" /><span className="text-cyan-400 text-xs font-medium">Revenue USDT</span></div>
                <p className="text-white text-xl sm:text-2xl font-bold">${Number(stats.revenueUSDT).toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-xl border border-amber-500/20 p-4">
                <div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-amber-400" /><span className="text-amber-400 text-xs font-medium">Revenue BDT</span></div>
                <p className="text-white text-xl sm:text-2xl font-bold">৳{Number(stats.revenueBDT).toLocaleString()}</p>
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {customers.map((customer) => {
              const isSuspended = customer.status === 'suspended';
              return (
                <div key={customer._id} className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-blue-500/30 p-4 sm:p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300" />
                  <div className="absolute top-3 right-3 z-10">
                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-semibold border ${getStatusStyle(customer.status)}`}>
                      {customer.statusInfo?.label || customer.status}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
                      <div className="relative">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                          {customer.avatar ? (
                            <img src={customer.avatar} alt={customer.name} className="w-full h-full rounded-2xl object-cover" />
                          ) : (
                            <span className="text-white text-lg sm:text-xl font-bold">
                              {customer.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${customer.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center">
                          <h3 className="text-white font-bold text-sm sm:text-base truncate group-hover:text-blue-200 transition-colors">{customer.name}</h3>
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm truncate">{customer.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl p-3 border border-blue-500/20">
                        <div className="flex items-center justify-between"><span className="text-blue-400 text-xs font-medium">Orders</span><span className="text-white font-bold text-sm">{customer.totalOrders || 0}</span></div>
                      </div>
                      <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-xl p-3 border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400 text-xs font-medium">Spent</span>
                          <div className="text-right">
                            {(customer.totalSpentUSDT || 0) > 0 && <div className="text-white font-bold text-sm">${formatPrice(Number(customer.totalSpentUSDT), 2)}</div>}
                            {(customer.totalSpentBDT || 0) > 0 && <div className="text-white font-bold text-sm">৳{formatPrice(Number(customer.totalSpentBDT), 2)}</div>}
                            {!(customer.totalSpentUSDT || 0) && !(customer.totalSpentBDT || 0) && <div className="text-white font-bold text-sm">$0.00</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleViewCustomer(customer)} className="flex-1 px-2 sm:px-3 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 rounded-xl hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-200 text-xs font-medium border border-blue-500/20 hover:border-blue-500/40">
                        <span className="flex items-center justify-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>View</span>
                      </button>
                      <button onClick={() => handleEditCustomer(customer)} className="flex-1 px-2 sm:px-3 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 rounded-xl hover:from-green-500/30 hover:to-green-600/30 transition-all duration-200 text-xs font-medium border border-green-500/20 hover:border-green-500/40">
                        <span className="flex items-center justify-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>Edit</span>
                      </button>
                      <button onClick={() => handleBanToggle(customer)} className={`flex-1 px-2 sm:px-3 py-2 rounded-xl transition-all duration-200 text-xs font-medium border ${isSuspended ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 hover:from-green-500/30 hover:to-green-600/30 border-green-500/20 hover:border-green-500/40' : 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 hover:from-red-500/30 hover:to-red-600/30 border-red-500/20 hover:border-red-500/40'}`}>
                        <span className="flex items-center justify-center gap-1">{isSuspended ? <><Shield className="w-3 h-3" />Activate</> : <><Ban className="w-3 h-3" />Ban</>}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <ViewCustomerModal showModal={showViewCustomerModal} setShowModal={setShowViewCustomerModal} customer={selectedCustomer} />
      <EditCustomerModal showModal={showEditCustomerModal} setShowModal={setShowEditCustomerModal} customer={selectedCustomer} onSave={handleEditSave} />
    </>
  );
}

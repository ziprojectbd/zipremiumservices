import { useEffect, useState, useCallback } from 'react';
import { Shield, Ban } from 'lucide-react';
import api from '../../lib/axios';
import { formatPrice } from '../../utils/formatPrice';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  country?: string;
  countryCode?: string;
  countryFlag?: string;
  totalOrders?: number;
  totalSpent?: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  traders: number;
  newUsers30d: number;
}

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const limit = 50;

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/admin/users/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch {
      // ignore - endpoint may not exist
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit, page };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/users', { params });
      if (res.data.success && res.data.data) {
        setUsers(res.data.data);
        setTotal(res.data.pagination?.total || 0);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const confirmed = window.confirm(
      nextStatus === 'suspended'
        ? `Suspend "${user.name}"?`
        : `Activate "${user.name}"?`
    );
    if (!confirmed) return;

    try {
      const res = await api.put(`/users/${user._id}`, { status: nextStatus });
      if (res.data.success && res.data.data) {
        setUsers((prev) => prev.map((u) => (u._id === user._id ? res.data.data as AdminUser : u)));
        fetchStats();
      }
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4 animate-pulse">
              <div className="h-3 bg-white/10 rounded w-16 mb-3" />
              <div className="h-6 bg-white/10 rounded w-20" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 text-xs font-medium">Total Users</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400 text-xs font-medium">Active</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.activeUsers}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl border border-red-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400 text-xs font-medium">Suspended</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.suspendedUsers}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-400 text-xs font-medium">Admins</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.adminUsers}</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 rounded-xl border border-cyan-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-cyan-400 text-xs font-medium">Traders</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.traders}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-xl border border-amber-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-400 text-xs font-medium">New (30d)</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.newUsers30d}</p>
          </div>
        </div>
      ) : null}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all" className="bg-gray-800">All Status</option>
          <option value="active" className="bg-gray-800">Active</option>
          <option value="suspended" className="bg-gray-800">Suspended</option>
          <option value="inactive" className="bg-gray-800">Inactive</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 sm:p-6">
          <div className="h-8 bg-white/10 rounded w-40 animate-pulse mb-6" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <th key={i} className="h-8 bg-white/10 rounded w-32 animate-pulse" />
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="h-12 bg-white/5 rounded" />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !users.length ? (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 sm:p-6">
          <div className="text-center py-16 text-gray-400">No users found</div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 sm:p-6">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Users Management</h2>
            <p className="text-xs text-gray-400 mt-1">All registered users (with or without orders)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">Name</th>
                  <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">Email</th>
                  <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">Country</th>
                  <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">Orders</th>
                  <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">Total Spent</th>
                  <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">Status</th>
                  <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSuspended = user.status === 'suspended';
                  return (
                    <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-center">
                        <div className="text-sm font-medium text-white">{user.name}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </td>
                      <td className="py-4 px-4 text-center text-xs whitespace-nowrap">
                        {user.countryFlag ? (
                          <span className="inline-flex items-center gap-1.5 justify-center" title={user.country || user.countryCode || ''}>
                            <span className="text-lg leading-none">{user.countryFlag}</span>
                            <span className="text-gray-300">{user.countryCode || ''}</span>
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-sm text-gray-300">{user.totalOrders || 0}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-sm text-gray-300">${formatPrice((user.totalSpent || 0), 2)}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`text-xs px-3 py-1 rounded-full border ${isSuspended ? 'text-red-300 border-red-500/30 bg-red-500/10' : 'text-green-300 border-green-500/30 bg-green-500/10'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                            isSuspended
                              ? 'text-green-300 border-green-500/30 bg-green-500/10 hover:bg-green-500/20'
                              : 'text-red-300 border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                          }`}
                        >
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1"><Shield className="w-3 h-3" /> Activate</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Ban className="w-3 h-3" /> Suspend</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {total > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {page} of {Math.ceil(total / limit)}
                </span>
                <button
                  onClick={() => setPage(Math.min(Math.ceil(total / limit), page + 1))}
                  disabled={page >= Math.ceil(total / limit)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

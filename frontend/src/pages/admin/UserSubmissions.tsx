import { useEffect, useState } from 'react';
import {
  Package, Mail, Phone, MapPin, CheckCircle, XCircle, Clock, DollarSign, Tag, Filter
} from 'lucide-react';
import api from '../../lib/axios';

interface UserSubmission {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  count: number;
  paymentMethod: string;
  paymentDetails: string;
  images: string[];
  contactEmail: string;
  contactPhone: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  userName: string;
  userId: string;
}

export default function UserSubmissions() {
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<UserSubmission | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; submission: UserSubmission | null; action: 'approved' | 'rejected' }>({
    isOpen: false,
    submission: null,
    action: 'approved'
  });
  const [adminNotice, setAdminNotice] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filter !== 'all') params.status = filter;
      const res = await api.get('/user-products', { params });
      if (res.data.success) {
        setSubmissions(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (submission: UserSubmission, action: 'approved' | 'rejected') => {
    setApprovalModal({ isOpen: true, submission, action });
    setAdminNotice('');
  };

  const handleStatusUpdate = async () => {
    if (!approvalModal.submission) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/user-products/${approvalModal.submission._id}`, {
        status: approvalModal.action,
        adminNotice: adminNotice.trim()
      });
      if (res.data.success) {
        fetchSubmissions();
        setSelectedSubmission(null);
        setApprovalModal({ isOpen: false, submission: null, action: 'approved' });
        setAdminNotice('');
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Product Submissions</h2>
          <p className="text-sm text-gray-400 mt-1">Review and manage user-submitted products for purchase</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          >
            <option value="all" className="bg-slate-900">All Submissions</option>
            <option value="pending" className="bg-slate-900">Pending</option>
            <option value="approved" className="bg-slate-900">Approved</option>
            <option value="rejected" className="bg-slate-900">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="text-2xl font-bold text-white">{submissions.length}</div>
          <div className="text-sm text-gray-400">Total</div>
        </div>
        <div className="bg-yellow-500/10 backdrop-blur-xl rounded-xl border border-yellow-500/20 p-4">
          <div className="text-2xl font-bold text-yellow-400">{submissions.filter(s => s.status === 'pending').length}</div>
          <div className="text-sm text-yellow-400/70">Pending</div>
        </div>
        <div className="bg-green-500/10 backdrop-blur-xl rounded-xl border border-green-500/20 p-4">
          <div className="text-2xl font-bold text-green-400">{submissions.filter(s => s.status === 'approved').length}</div>
          <div className="text-sm text-green-400/70">Approved</div>
        </div>
        <div className="bg-red-500/10 backdrop-blur-xl rounded-xl border border-red-500/20 p-4">
          <div className="text-2xl font-bold text-red-400">{submissions.filter(s => s.status === 'rejected').length}</div>
          <div className="text-sm text-red-400/70">Rejected</div>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Loading...</div>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
          <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No submissions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissions.map((submission) => (
            <div
              key={submission._id}
              onClick={() => setSelectedSubmission(submission)}
              className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 cursor-pointer hover:border-white/20 transition-all"
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(submission.status)}`}>
                  {getStatusIcon(submission.status)}
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Product Info */}
              <h3 className="text-lg font-semibold text-white mb-1 truncate">{submission.name}</h3>

              {/* Price & Count */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1 text-green-400 font-semibold">
                  <DollarSign className="w-4 h-4" />
                  {submission.price} {submission.currency}
                </div>
                <div className="flex items-center gap-1 text-blue-400 text-sm">
                  <Package className="w-3 h-3" />
                  Qty: {submission.count}
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex items-center gap-1 text-purple-400 text-sm mb-3">
                <Tag className="w-3 h-3" />
                {submission.paymentMethod}
              </div>

              {/* Images Preview */}
              {submission.images.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {submission.images.slice(0, 3).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Product ${idx + 1}`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ))}
                  {submission.images.length > 3 && (
                    <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                      +{submission.images.length - 3}
                    </div>
                  )}
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {submission.contactEmail}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {submission.contactPhone}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/20 max-w-md w-full">
            {/* Modal Header */}
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {approvalModal.action === 'approved' ? 'Approve Submission' : 'Reject Submission'}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {approvalModal.submission?.name}
                  </p>
                </div>
                <button
                  onClick={() => setApprovalModal({ isOpen: false, submission: null, action: 'approved' })}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Notice Input */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  {approvalModal.action === 'approved' ? 'Approval Notice' : 'Rejection Reason'}
                  <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                </label>
                <textarea
                  value={adminNotice}
                  onChange={(e) => setAdminNotice(e.target.value)}
                  placeholder={
                    approvalModal.action === 'approved'
                      ? 'Add a message for the user about their approved submission...'
                      : 'Explain why this submission is being rejected...'
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                />
              </div>

              {/* Action Summary */}
              <div className={`p-4 rounded-xl border ${
                approvalModal.action === 'approved'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  {approvalModal.action === 'approved' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      approvalModal.action === 'approved' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {approvalModal.action === 'approved' ? 'This submission will be approved' : 'This submission will be rejected'}
                    </p>
                    <p className="text-sm text-gray-400">
                      The user will be notified and can see this in their submission history
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setApprovalModal({ isOpen: false, submission: null, action: 'approved' })}
                  className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 ${
                    approvalModal.action === 'approved'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {actionLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    `${approvalModal.action === 'approved' ? 'Approve' : 'Reject'} Submission`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedSubmission.name}</h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status & Actions */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(selectedSubmission.status)}`}>
                  {getStatusIcon(selectedSubmission.status)}
                  {selectedSubmission.status.charAt(0).toUpperCase() + selectedSubmission.status.slice(1)}
                </span>
                {selectedSubmission.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(selectedSubmission, 'approved')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Approve & Contact
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedSubmission, 'rejected')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Images */}
              {selectedSubmission.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    📷 Product Images
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedSubmission.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Product ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg border border-white/10"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Price
                  </h4>
                  <p className="text-2xl font-bold text-green-400">
                    {selectedSubmission.price} {selectedSubmission.currency}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Quantity
                  </h4>
                  <p className="text-white">{selectedSubmission.count}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Condition
                  </h4>
                  <p className="text-white capitalize">{selectedSubmission.condition}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Payment Method
                  </h4>
                  <p className="text-white">{selectedSubmission.paymentMethod}</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Payment Details
                  </h4>
                  <p className="text-white bg-white/5 p-3 rounded-lg">{selectedSubmission.paymentDetails}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Description</h4>
                <p className="text-gray-300 whitespace-pre-wrap">{selectedSubmission.description}</p>
              </div>

              {/* Contact Information */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-white mb-3">Contact Information</h4>
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>{selectedSubmission.contactEmail}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Phone className="w-4 h-4 text-green-400" />
                  <span>{selectedSubmission.contactPhone}</span>
                </div>
                {selectedSubmission.location && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span>{selectedSubmission.location}</span>
                  </div>
                )}
              </div>

              {/* Submission Info */}
              <div className="text-xs text-gray-500">
                <p>Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                {selectedSubmission.userName && <p>User: {selectedSubmission.userName}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

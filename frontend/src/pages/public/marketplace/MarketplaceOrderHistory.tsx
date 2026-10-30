import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../../../utils/formatPrice";
import {
  ArrowLeft,
  Clock,
  Check,
  Zap,
  AlertCircle,
  History,
  ChevronRight,
  Package,
  BadgeCheck,
  X,
  CreditCard,
  Smartphone,
  Bitcoin,
  Copy
} from "lucide-react";
import { useShopContext } from "../../../store/ShopContext";
import api from "../../../lib/axios";

interface MarketplaceOrder {
  _id: string;
  orderNumber: string;
  listingId: {
    _id: string;
    title: string;
    price: number;
    images: string[];
    assetType: string;
    subscribers?: number;
    pageFollowers?: number;
    pageLikes?: number;
    groupMembers?: number;
    instagramFollowers?: number;
    accountRank?: string;
    accountLevel?: number;
  };
  buyerEmail: string;
  buyerName: string;
  sellerEmail: string;
  sellerName: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'completed' | 'cancelled' | 'disputed';
  createdAt: string;
  transactionId?: string;
  paymentNumber?: string;
}

export default function MarketplaceOrderHistory() {
  const navigate = useNavigate();
  const {
    isLoggedIn,
    userEmail,
    showAlert,
    paymentSettings,
  } = useShopContext();

  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);
  const [sellerVerified, setSellerVerified] = useState<Record<string, boolean>>({});
  const [sellerImages, setSellerImages] = useState<Record<string, string>>({});
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    method: '',
    number: '',
    transactionId: ''
  });
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Crypto payment states
  const [cryptoCurrency, setCryptoCurrency] = useState('USDT');
  const [paymentType, setPaymentType] = useState<'network' | 'uid'>('network');
  const [selectedNetwork, setSelectedNetwork] = useState('TRC20');
  const [selectedPlatform, setSelectedPlatform] = useState('Binance');
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyNumber = (provider: string, number: string) => {
    navigator.clipboard.writeText(number);
    setCopySuccess(provider);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Get crypto settings from paymentSettings
  const getCryptoSettings = () => {
    const cryptoPayments = paymentSettings?.cryptoPayments || [];
    const enabledPayments = cryptoPayments.filter((p: any) => p.enabled);

    const networks: Record<string, { enabled: boolean; address: string }> = {};
    const platforms: Record<string, { enabled: boolean; uid: string }> = {};
    const currencies: Record<string, boolean> = {};

    enabledPayments.forEach((p: any) => {
      currencies[p.currency] = true;
    });

    const currentCurrencyPayments = enabledPayments.filter((p: any) => p.currency === cryptoCurrency);

    currentCurrencyPayments.forEach((p: any) => {
      if (p.payType === 'network' && p.network) {
        networks[p.network] = { enabled: true, address: p.address || '' };
      } else if (p.payType === 'uid' && p.platform) {
        platforms[p.platform] = { enabled: true, uid: p.uid || '' };
      }
    });

    return { networks, platforms, currencies };
  };

  const { networks: cryptoNetworksData, platforms: cryptoPlatformsData, currencies: cryptoCurrenciesData } = getCryptoSettings();

  // Auto-select first currency/network/platform when paymentSettings load
  useEffect(() => {
    if (paymentSettings?.cryptoPayments) {
      const enabled = paymentSettings.cryptoPayments.filter((p: any) => p.enabled);
      if (enabled.length > 0) {
        if (!cryptoCurrency || !cryptoCurrenciesData[cryptoCurrency]) {
          setCryptoCurrency(enabled[0].currency);
        }
      }
    }
  }, [paymentSettings]);

  // Auto-select first network/platform when currency or type changes
  useEffect(() => {
    if (paymentType === 'network') {
      const availableNetworks = Object.keys(cryptoNetworksData);
      if (availableNetworks.length > 0 && (!selectedNetwork || !cryptoNetworksData[selectedNetwork])) {
        setSelectedNetwork(availableNetworks[0]);
      }
    } else {
      const availablePlatforms = Object.keys(cryptoPlatformsData);
      if (availablePlatforms.length > 0 && (!selectedPlatform || !cryptoPlatformsData[selectedPlatform])) {
        setSelectedPlatform(availablePlatforms[0]);
      }
    }
  }, [cryptoCurrency, paymentType, cryptoNetworksData, cryptoPlatformsData]);

  // Get payment instructions based on selected payment method
  const getPaymentInstructions = () => {
    if (!paymentSettings?.mobilePayments) return { instructions: '', warningInstructions: '', number: '', merchantName: '', numberType: 'merchant' };

    const methodName = paymentForm.method.charAt(0).toUpperCase() + paymentForm.method.slice(1);
    const payment = paymentSettings.mobilePayments.find(
      (p: any) => p.method.toLowerCase() === paymentForm.method.toLowerCase() && p.enabled
    );

    if (payment) {
      return {
        instructions: payment.instructions || '',
        warningInstructions: payment.warningInstructions || '',
        number: payment.number || '',
        merchantName: payment.merchantName || '',
        numberType: payment.numberType || 'merchant'
      };
    }
    return { instructions: '', warningInstructions: '', number: '', merchantName: '', numberType: 'merchant' };
  };

  const { instructions: paymentInstructionsData, warningInstructions: warningInstructionsData, number: paymentNumber, merchantName: paymentMerchantName, numberType: paymentNumberType } = getPaymentInstructions();

  const isPayCrypto = paymentForm.method === 'paycrypto';
  const isBDMobileMethod = ['bkash', 'nagad', 'rocket', 'upay', 'tap', 'mcb', 'ibbl', 'dbbl', 'brac', 'city', 'ucash'].includes(paymentForm.method.toLowerCase());

  // Show Payment Summary in Checkout Style
  const renderPaymentSummary = () => {
    if (!selectedOrder) return null;

    return (
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Payment Summary</h4>
          <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="text-xs font-bold text-green-400">Order #{selectedOrder.orderNumber}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Subtotal</span>
            <span className="text-white font-medium">৳{selectedOrder.amount?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Processing Fee</span>
            <span className="text-green-400 text-sm">Free</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-white/5">
            <span className="text-white font-bold">Total Amount</span>
            <div className="text-right">
              <span className="text-2xl font-black text-white block">৳{selectedOrder.amount?.toLocaleString()}</span>
              {isPayCrypto && (
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  ≈ ${formatPrice(selectedOrder.amount / (paymentSettings?.exchangeRate || 110), 2)} USD
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!paymentForm.method || !paymentForm.number || !paymentForm.transactionId) {
      showAlert('warning', 'Missing Fields', 'Please fill in all payment details');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await api.patch('/trader-orders', {
        orderId: selectedOrder._id,
        status: 'paid',
        paymentMethod: paymentForm.method,
        paymentNumber: paymentForm.number,
        transactionId: paymentForm.transactionId
      });

      if (res.status >= 200 && res.status < 300) {
        showAlert('success', 'Payment Submitted', 'Your payment details have been sent for verification.');
        setSelectedOrder(null);
        const email = userEmail;
        if (email) {
          const resOrders = await api.get('/trader-orders', { params: { email, role: 'buyer' } });
          if (Array.isArray(resOrders.data)) {
            setOrders(resOrders.data);
          }
        }
      } else {
        showAlert('error', 'Error', 'Failed to submit payment details');
      }
    } catch {
      showAlert('error', 'Error', 'Something went wrong');
    } finally {
      setSubmittingPayment(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/sign-in');
      return;
    }

    const fetchOrders = async () => {
      const email = userEmail;
      if (!email) return;

      try {
        const res = await api.get('/trader-orders', { params: { email, role: 'buyer' } });
        const data = res.data;
        if (Array.isArray(data)) {
          setOrders(data);

          const sellerEmails = Array.from(new Set(data.map((order: MarketplaceOrder) => order.sellerEmail)));
          sellerEmails.forEach(async (sellerEmail) => {
            try {
              const resKyc = await api.get('/traders/check-user', { params: { email: sellerEmail } });
              const dataKyc = resKyc.data;
              if (dataKyc.success && dataKyc.trader?.isVerified && dataKyc.trader?.status === 'approved') {
                setSellerVerified(prev => ({ ...prev, [sellerEmail]: true }));
              }

              const resUser = await api.get('/auth/user', { params: { email: sellerEmail } });
              const dataUser = resUser.data;
              if (dataUser.success && dataUser.data?.image) {
                setSellerImages(prev => ({ ...prev, [sellerEmail]: dataUser.data.image }));
              } else if (dataKyc.success && dataKyc.trader?.image) {
                setSellerImages(prev => ({ ...prev, [sellerEmail]: dataKyc.trader.image }));
              }
            } catch {
              // ignore
            }
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isLoggedIn, userEmail]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/20';
      case 'paid': return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      case 'approved': return 'bg-purple-500/20 text-purple-400 border-purple-500/20';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/20';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/marketplace/listings')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Marketplace Orders</h1>
            <p className="text-slate-400">Track your asset acquisitions and bids</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-slate-400">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-white/10">
            <History className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-bold text-white mb-2">No Marketplace Orders</h3>
            <p className="text-slate-400 mb-8">You haven't placed any orders in the marketplace yet.</p>
            <button
              onClick={() => navigate('/marketplace/listings')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className="group bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/50 transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0">
                      {order.listingId?.images?.[0] ? (
                        <img src={order.listingId.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 m-4 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">{order.listingId?.title || "Deleted Item"}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">Order #{order.orderNumber}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">৳{order.amount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Seller: {order.sellerName}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors hidden sm:block" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white">Marketplace Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6">
              {/* Progress Stepper */}
              <div className="mb-10 px-4">
                <div className="relative flex justify-between items-center w-full">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 -z-10"></div>
                  <div
                    className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 -translate-y-1/2 -z-10 transition-all duration-500"
                    style={{
                      width: selectedOrder.status === 'pending' ? '0%' :
                             selectedOrder.status === 'approved' ? '33%' :
                             selectedOrder.status === 'paid' ? '66%' :
                             selectedOrder.status === 'completed' ? '100%' : '0%'
                    }}
                  ></div>

                  {[
                    { label: 'Pending', status: 'pending', icon: Clock },
                    { label: 'Approved', status: 'approved', icon: Check },
                    { label: 'Paid', status: 'paid', icon: Zap },
                    { label: 'Completed', status: 'completed', icon: BadgeCheck },
                  ].map((step, index) => {
                    const Icon = step.icon;
                    const isActive = selectedOrder.status === step.status;
                    const isCompleted =
                      (selectedOrder.status === 'approved' && step.status === 'pending') ||
                      (selectedOrder.status === 'paid' && (step.status === 'pending' || step.status === 'approved')) ||
                      (selectedOrder.status === 'completed' && (step.status === 'pending' || step.status === 'approved' || step.status === 'paid')) ||
                      selectedOrder.status === step.status;

                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                            isActive
                              ? 'bg-slate-900 border-purple-500 text-purple-500 shadow-lg shadow-purple-500/20 scale-110'
                              : isCompleted
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : 'bg-slate-900 border-white/10 text-slate-600'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-xs mt-2 font-medium ${
                          isActive ? 'text-purple-500' : isCompleted ? 'text-blue-500' : 'text-slate-600'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Section - Show when seller has approved (status = approved) */}
              {selectedOrder.status === 'approved' && (
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-purple-600/10 border border-purple-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <CreditCard className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Payment to Broker</h3>
                    </div>

                    {renderPaymentSummary()}

                    {/* Payment Method Selection */}
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 ml-1">Select Payment Method</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {paymentSettings?.mobilePayments && paymentSettings.mobilePayments.filter((p: any) => p.enabled).map((p: any) => (
                          <button
                            key={p.method}
                            type="button"
                            onClick={() => setPaymentForm({...paymentForm, method: p.method.toLowerCase()})}
                            className={`p-3 rounded-xl border transition-all ${
                              paymentForm.method === p.method.toLowerCase()
                                ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                                : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/10'
                            }`}
                          >
                            <Smartphone className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-xs font-medium">{p.method}</span>
                          </button>
                        ))}
                        {paymentSettings?.cryptoPayments && paymentSettings.cryptoPayments.filter((p: any) => p.enabled).length > 0 && (
                          <button
                            type="button"
                            onClick={() => setPaymentForm({...paymentForm, method: 'paycrypto'})}
                            className={`p-3 rounded-xl border transition-all ${
                              isPayCrypto
                                ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                                : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/10'
                            }`}
                          >
                            <Bitcoin className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-xs font-medium">Crypto</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mobile Payment Instructions */}
                    {isBDMobileMethod && paymentNumber && (
                      <div className="mb-6 p-4 bg-slate-900/50 border border-white/5 rounded-xl">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">{paymentForm.method} Number</p>
                            <p className="text-lg font-bold text-white font-mono">{paymentNumber}</p>
                            <p className="text-xs text-slate-400">{paymentNumberType} • {paymentMerchantName}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyNumber(paymentForm.method, paymentNumber)}
                            className="px-3 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg text-xs hover:bg-purple-600/30"
                          >
                            {copySuccess === paymentForm.method ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        {paymentInstructionsData && (
                          <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                            {paymentInstructionsData.split('\n').filter((line: string) => line.trim()).map((line: string, idx: number) => (
                              <li key={idx}>{line}</li>
                            ))}
                          </ul>
                        )}
                        {warningInstructionsData && (
                          <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                            <p className="text-xs text-yellow-400 font-semibold">⚠️ Important:</p>
                            <ul className="text-[10px] text-yellow-300 space-y-0.5 mt-1 list-disc pl-4">
                              {warningInstructionsData.split('\n').filter((line: string) => line.trim()).map((line: string, idx: number) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Crypto Payment Instructions */}
                    {isPayCrypto && (
                      <div className="mb-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Currency</label>
                            <select
                              value={cryptoCurrency}
                              onChange={(e) => setCryptoCurrency(e.target.value)}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                            >
                              {Object.entries(cryptoCurrenciesData || {})
                                .filter(([_, enabled]) => enabled)
                                .map(([currency]) => (
                                  <option key={currency} value={currency}>{currency}</option>
                                ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Pay Via</label>
                            <select
                              value={paymentType}
                              onChange={(e) => setPaymentType(e.target.value as 'network' | 'uid')}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                            >
                              <option value="network">Network</option>
                              <option value="uid">UID</option>
                            </select>
                          </div>
                          {paymentType === 'network' ? (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase">Network</label>
                              <select
                                value={selectedNetwork}
                                onChange={(e) => setSelectedNetwork(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                              >
                                {Object.entries(cryptoNetworksData || {})
                                  .filter(([_, data]: [string, any]) => data?.enabled)
                                  .map(([network]) => (
                                    <option key={network} value={network}>{network}</option>
                                  ))}
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase">Platform</label>
                              <select
                                value={selectedPlatform}
                                onChange={(e) => setSelectedPlatform(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                              >
                                {Object.entries(cryptoPlatformsData || {})
                                  .filter(([_, data]: [string, any]) => data?.enabled)
                                  .map(([platform]) => (
                                    <option key={platform} value={platform}>{platform}</option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Crypto Address Display */}
                        <div className="p-4 bg-slate-900/50 border border-white/5 rounded-xl">
                          <p className="text-xs text-slate-500 uppercase font-bold mb-2">
                            {paymentType === 'network' ? 'Wallet Address' : 'Your UID'}
                          </p>
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-white font-mono break-all flex-1">
                              {paymentType === 'network'
                                ? (cryptoNetworksData[selectedNetwork]?.address || 'No address')
                                : (cryptoPlatformsData[selectedPlatform]?.uid || 'No UID')
                              }
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                const text = paymentType === 'network'
                                  ? (cryptoNetworksData[selectedNetwork]?.address || '')
                                  : (cryptoPlatformsData[selectedPlatform]?.uid || '');
                                navigator.clipboard.writeText(text);
                                setCopiedAddress(true);
                                setTimeout(() => setCopiedAddress(false), 2000);
                              }}
                              className="px-3 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg text-xs hover:bg-purple-600/30"
                            >
                              {copiedAddress ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Submission Form */}
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {isBDMobileMethod && (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Your Number</label>
                            <input
                              type="tel"
                              placeholder="+8801XXXXXXXXX"
                              value={paymentForm.number}
                              onChange={(e) => {
                                let v = e.target.value;
                                v = v.replace(/[^+\d]/g, "");
                                if (v === "+") v = "+880";
                                if (v.startsWith("880")) v = "+" + v;
                                if (v.startsWith("01")) v = "+880" + v.slice(1);
                                if (v.startsWith("1")) v = "+880" + v;
                                if (!v.startsWith("+880")) {
                                  if (v === "" || v === "+") v = "+880";
                                }
                                if (v.length > 14) v = v.slice(0, 14);
                                setPaymentForm({...paymentForm, number: v});
                              }}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                              required
                            />
                          </div>
                        )}
                        {isPayCrypto && (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                              {paymentType === 'network' ? 'Your Wallet Address' : 'Your UID'}
                            </label>
                            <input
                              type="text"
                              placeholder={paymentType === 'network' ? "Enter your wallet address" : "Enter your UID"}
                              value={paymentForm.number}
                              onChange={(e) => setPaymentForm({...paymentForm, number: e.target.value})}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 font-mono text-sm"
                              required
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                            {isPayCrypto && paymentType === 'network' ? 'Transaction Hash' : 'Transaction ID'}
                          </label>
                          <input
                            type="text"
                            placeholder={isPayCrypto && paymentType === 'network' ? "Enter transaction hash" : "Paste Transaction ID here"}
                            value={paymentForm.transactionId}
                            onChange={(e) => setPaymentForm({...paymentForm, transactionId: e.target.value})}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 font-mono text-sm"
                            required
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900/50 border border-white/5 rounded-xl">
                        <p className="text-xs text-slate-400">
                          {isBDMobileMethod
                            ? "Make sure you have sent to correct account and pasted the correct Transaction ID. Your payment will be verified manually."
                            : "Make sure you have sent to correct address/UID. Your payment will be verified manually."}
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={submittingPayment || !paymentForm.method || !paymentForm.number || !paymentForm.transactionId}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingPayment ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Confirm Payment
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Item Info */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Item Information</h4>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-white/5">
                       <img src={selectedOrder.listingId?.images?.[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                      <h5 className="font-bold text-white text-sm line-clamp-1">{selectedOrder.listingId?.title}</h5>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase rounded-md">
                          {selectedOrder.listingId?.assetType}
                        </span>

                        {/* Dynamic Stat Badges */}
                        {selectedOrder.listingId && (
                          <>
                            {selectedOrder.listingId.assetType === 'youtube' && (selectedOrder.listingId as any).subscribers !== undefined && (
                              <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold rounded-md shadow-sm shadow-red-500/10">
                                {Number((selectedOrder.listingId as any).subscribers).toLocaleString()} Subs
                              </span>
                            )}
                            {selectedOrder.listingId.assetType === 'facebook-page' && (
                              <>
                                {(selectedOrder.listingId as any).pageFollowers !== undefined && (
                                  <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded-md shadow-sm shadow-blue-500/10">
                                    {Number((selectedOrder.listingId as any).pageFollowers).toLocaleString()} Followers
                                  </span>
                                )}
                                {(selectedOrder.listingId as any).pageLikes !== undefined && (
                                  <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded-md shadow-sm shadow-blue-500/10">
                                    {Number((selectedOrder.listingId as any).pageLikes).toLocaleString()} Likes
                                  </span>
                                )}
                              </>
                            )}
                            {selectedOrder.listingId.assetType === 'facebook-group' && (
                              <>
                                {(selectedOrder.listingId as any).groupMembers !== undefined && (
                                  <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded-md shadow-sm shadow-blue-500/10">
                                    {Number((selectedOrder.listingId as any).groupMembers).toLocaleString()} Members
                                  </span>
                                )}
                              </>
                            )}
                            {selectedOrder.listingId.assetType === 'instagram' && (selectedOrder.listingId as any).instagramFollowers !== undefined && (
                              <span className="px-2 py-0.5 bg-pink-500/20 border border-pink-500/30 text-pink-400 text-[10px] font-bold rounded-md shadow-sm shadow-pink-500/10">
                                {Number((selectedOrder.listingId as any).instagramFollowers).toLocaleString()} Followers
                              </span>
                            )}
                            {(selectedOrder.listingId.assetType === 'pubg' || selectedOrder.listingId.assetType === 'freefire') && (
                              <>
                                {(selectedOrder.listingId as any).accountRank && (
                                  <span className="px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-bold rounded-md uppercase shadow-sm shadow-orange-500/10">
                                    {(selectedOrder.listingId as any).accountRank}
                                  </span>
                                )}
                                {(selectedOrder.listingId as any).accountLevel !== undefined && (
                                  <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold rounded-md shadow-sm shadow-yellow-500/10">
                                    Lvl {(selectedOrder.listingId as any).accountLevel}
                                  </span>
                                )}
                              </>
                            )}
                          </>
                        )}

                        <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold rounded-md shadow-sm shadow-green-500/10">
                          ৳{selectedOrder.amount?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Seller Details</h4>
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
                    <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden border border-white/10 flex-shrink-0">
                      {sellerImages[selectedOrder.sellerEmail] ? (
                        <img src={sellerImages[selectedOrder.sellerEmail]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-600/20 text-purple-400 font-bold text-lg">
                          {selectedOrder.sellerName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm text-white font-bold truncate">{selectedOrder.sellerName}</span>
                        {sellerVerified[selectedOrder.sellerEmail] && (
                          <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-bold uppercase rounded-md shadow-sm shadow-green-500/5 whitespace-nowrap">
                            KYC Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{selectedOrder.sellerEmail}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Trader Role</span>
                      <span className="text-slate-300 font-medium">Verified Seller</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info - Only show when paid or completed */}
                {(selectedOrder.status === 'paid' || selectedOrder.status === 'completed') && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 md:col-span-2 overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Payment Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="min-w-0">
                        <span className="text-xs text-slate-500 block mb-1">Method</span>
                        <span className="text-sm text-white font-medium uppercase bg-white/5 px-2 py-1 rounded inline-block">
                          {selectedOrder.paymentMethod}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-slate-500 block mb-1">Transaction ID</span>
                        <div className="relative group">
                          <div className="text-sm text-white font-mono break-all bg-white/5 pl-2 pr-9 py-1 rounded w-full">
                            {selectedOrder.transactionId || 'Not provided'}
                          </div>
                          {selectedOrder.transactionId && (
                            <button
                              onClick={() => handleCopyNumber('trx', selectedOrder.transactionId || '')}
                              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-500 hover:text-white"
                              title="Copy Transaction ID"
                            >
                              {copySuccess === 'trx' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-slate-500 block mb-1">Payer</span>
                        <div className="relative group">
                          <div className="text-sm text-white font-medium break-all bg-white/5 pl-2 pr-9 py-1 rounded w-full">
                            {selectedOrder.paymentNumber || 'Not provided'}
                          </div>
                          {selectedOrder.paymentNumber && (
                            <button
                              onClick={() => handleCopyNumber('payer', selectedOrder.paymentNumber || '')}
                              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-500 hover:text-white"
                              title="Copy Payer Info"
                            >
                              {copySuccess === 'payer' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-slate-500 block mb-1">Order Date</span>
                        <div className="text-sm text-white font-medium bg-white/5 px-2 py-1 rounded w-full">
                          {new Date(selectedOrder.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Always show Order Date if payment info is hidden */}
                {!(selectedOrder.status === 'paid' || selectedOrder.status === 'completed') && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 md:col-span-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Order Details</h4>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Order Date</span>
                      <span className="text-sm text-white font-medium bg-white/5 px-2 py-1 rounded">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-colors"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

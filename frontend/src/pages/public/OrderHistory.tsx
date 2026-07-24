import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import OrderHistoryComponent from "../../components/public/OrderHistory";
import { useShopContext } from "../../store/ShopContext";
import api from "../../lib/axios";
import type { Order } from "../../types";
import { formatPrice } from "../../utils/formatPrice";

export default function OrderHistoryPage() {
    const navigate = useNavigate();
    const {
        addToCart,
        getTotalItems,
        orders,
        setOrders,
        setView,
        isLoggedIn,
        setIsLoggedIn,
        userEmail,
        setUserEmail,
        setUsername,
        isLoading,
        setIsLoading,
        menuOpen,
        setMenuOpen,
        theme,
        toggleTheme,
        username,
        userImage,
        alertConfig,
        setAlertConfig,
        showAlert,
        setIsCartOpen,
    } = useShopContext();

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const email = userEmail || "";
        if (!email) return;

        const fetchOrders = async () => {
            try {
                const res = await api.get(`/orders?email=${encodeURIComponent(email)}`);
                const json = res.data;

                const regularData = Array.isArray(json?.data) ? json.data : [];

                const mappedRegularOrders: Order[] = regularData.map((order: any) => {
                    const rawStatus = String(order.status || "").toLowerCase();
                    const mappedStatus: Order["status"] =
                        rawStatus === "approved" || rawStatus === "delivered" || rawStatus === "completed"
                            ? "completed"
                            : rawStatus === "rejected" || rawStatus === "cancelled"
                                ? "cancelled"
                                : rawStatus === "processing"
                                    ? "processing"
                                    : "pending";

                    const items = Array.isArray(order.items) && order.items.length
                        ? order.items.map((item: any, index: number) => ({
                            id: Date.now() + index,
                            name: item?.productName || item?.name || order.productName || "Product",
                            description: "",
                            price: Number(item?.price ?? item?.usdtAmount ?? 0),
                            originalPrice: Number(item?.price ?? item?.usdtAmount ?? 0),
                            category: "",
                            features: [],
                            quantity: Number(item?.quantity || 1),
                        }))
                        : [{
                            id: Date.now(),
                            name: order.productName || "Product",
                            description: "",
                            price: Number(order.amount || 0),
                            originalPrice: Number(order.amount || 0),
                            category: "",
                            features: [],
                            quantity: 1,
                        }];

                    return {
                        id: order._id,
                        orderNumber: order.orderNumber,
                        date: order.createdAt || order.created_at || new Date().toISOString(),
                        status: mappedStatus,
                        total: Number(order.amount || 0),
                        items: items as any,
                        email: order.email || "",
                        paymentMethod: order.paymentMethod || order.payment_method || "",
                        paymentStatus: order.paymentStatus || order.payment_status || "",
                        trxId: order.transactionId || order.transaction_id || order.txHash || "",
                        transactionId: order.transactionId || order.transaction_id || "",
                        payerNumber: order.paymentNumber || order.payment_number || "",
                        paymentNumber: order.paymentNumber || order.payment_number || "",
                        txHash: order.txHash || "",
                        walletAddress: order.walletAddress || order.wallet_address || "",
                        paidVia: order.paidVia || order.paid_via || "",
                        selectedNetwork: order.selectedNetwork || order.selected_network || "",
                        selectedPlatform: order.selectedPlatform || order.selected_platform || "",
                        senderUid: order.senderUid || order.sender_uid || "",
                        cryptoCurrency: order.cryptoCurrency || order.crypto_currency || "",
                        currency: order.currency || "BDT",
                        p2pToken: order.p2pToken || "",
                        p2pNetwork: order.p2pNetwork || "",
                        p2pWalletAddress: order.p2pWalletAddress || "",
                        captchaApiKey: order.captchaApiKey || null,
                        deliveryNote: order.deliveryNote || "",
                    };
                });

                setOrders(mappedRegularOrders.sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                ));
            } catch (error) {
                setOrders([]);
            }
        };

        fetchOrders();
    }, [userEmail, setOrders]);

    // Filter for completed and past orders only
    const completedOrders = orders.filter(order =>
        order.status === 'completed' || order.status === 'cancelled'
    );

    const handleReorder = (order: Order) => {
        order.items.forEach((item) => {
            for (let i = 0; i < item.quantity; i++) {
                addToCart(item);
            }
        });
        showAlert("success", "Reorder", "Items added to cart for reorder!");
    };

    if (!isLoggedIn && !isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-white mb-4">Please Sign In to view your order history</h1>
                <button
                    onClick={() => { navigate("/sign-in"); }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Go to Sign In
                </button>
            </div>
        );
    }

    // Compute stats from orders
    const stats = React.useMemo(() => {
        const total = orders.length;
        const completed = orders.filter(o => o.status === 'completed').length;
        const cancelled = orders.filter(o => o.status === 'cancelled').length;
        const bdtSpent = orders.reduce((sum, o) => sum + ((o.currency !== 'USDT') ? (o.total || 0) : 0), 0);
        const usdtSpent = orders.reduce((sum, o) => sum + (o.currency === 'USDT' ? (o.total || 0) : 0), 0);
        return { total, completed, cancelled, bdtSpent, usdtSpent };
    }, [orders]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100 transition-colors">
            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-blue-400 text-xs font-medium">Total Orders</span>
                        </div>
                        <p className="text-white text-xl sm:text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-400 text-xs font-medium">Completed</span>
                        </div>
                        <p className="text-white text-xl sm:text-2xl font-bold">{stats.completed}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl border border-red-500/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-red-400 text-xs font-medium">Cancelled</span>
                        </div>
                        <p className="text-white text-xl sm:text-2xl font-bold">{stats.cancelled}</p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 rounded-xl border border-cyan-500/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-cyan-400 text-xs font-medium">Total Spent (BDT)</span>
                        </div>
                        <p className="text-white text-xl sm:text-2xl font-bold">{formatPrice(stats.bdtSpent, 2)} ৳</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-xl border border-amber-500/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-amber-400 text-xs font-medium">Total Spent (USDT)</span>
                        </div>
                        <p className="text-white text-xl sm:text-2xl font-bold">${formatPrice(stats.usdtSpent, 2)}</p>
                    </div>
                </div>
            </div>

            <OrderHistoryComponent
                orders={completedOrders}
                onReorder={handleReorder}
            />
        </div>
    );
}

import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OrderHistory from "../../components/public/OrderHistory";
import { useShopContext } from "../../store/ShopContext";
import api from "../../lib/axios";
import type { Order } from "../../types";

export default function MyOrdersPage() {
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
                if (!json?.success || !Array.isArray(json?.data)) {
                    setOrders([]);
                    return;
                }

                const mappedOrders: Order[] = json.data.map((order: any) => {
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
                        deliveryNote: order.deliveryNote || "",
                    };
                });

                setOrders(mappedOrders);
            } catch (error) {
                setOrders([]);
            }
        };

        fetchOrders();
    }, [userEmail, setOrders]);

    // Filter for active/pending orders only
    const activeOrders = orders.filter(order =>
        order.status === 'pending' || order.status === 'processing'
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
                <h1 className="text-2xl font-bold text-white mb-4">Please Sign In to view your orders</h1>
                <button
                    onClick={() => { navigate("/sign-in"); }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Go to Sign In
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100 transition-colors">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">My Orders</h1>
                    <p className="text-gray-300">Track and manage your orders</p>
                </div>

                <OrderHistory
                    orders={activeOrders}
                    onReorder={handleReorder}
                />
            </div>
        </div>
    );
}

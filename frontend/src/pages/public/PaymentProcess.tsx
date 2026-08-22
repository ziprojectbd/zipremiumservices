import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import axios from "axios";
import { useShopContext } from "../../store/ShopContext";

// Payment confirmation must NOT go through the shared axios instance — its
// interceptors redirect to /sign-in whenever a stale/expired JWT is found in
// localStorage (or a 401 arrives). Both /payment-resolve and /orders are
// public endpoints, so an auth-agnostic instance avoids that redirect and
// lets the order complete even with expired session tokens present.
const apiPublic = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

const PAYMENT_METHODS = ["bkash", "nagad", "rocket", "upay", "tap"];

interface CartItemPayload {
  dbId: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  smmProvider?: string;
  smmServiceId?: string;
  link?: string;
  details?: string;
  customData?: Record<string, unknown>;
  orderFields?: unknown[];
  [key: string]: unknown;
}

interface CheckoutData {
  email: string;
  username: string;
  paymentMethod: string;
  payerNumber?: string;
  totalAmount: number;
  orderId?: string;
  cart: CartItemPayload[];
  couponCode?: string;
  couponDiscount?: number;
  couponType?: string;
}

interface ResolvedPayment {
  provider: string;
  amount: number;
  currency: string;
  orderId: string;
  payerNumber: string;
  trxId: string;
  merchantName: string;
}

export default function PaymentProcess() {
  const navigate = useNavigate();
  const { setCart } = useShopContext();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // Read the cart + order context that was saved before redirecting to ZI Pay.
        const raw = localStorage.getItem("zi-pay-checkout-data");
        if (!raw) {
          setErrorMsg("No payment data found. Please go back and try again.");
          setStatus("error");
          return;
        }
        if (cancelled) return;

        const checkout: CheckoutData = JSON.parse(raw);
        if (!checkout?.cart?.length || !checkout.email) {
          setErrorMsg("Payment data is incomplete. Please go back to checkout.");
          setStatus("error");
          return;
        }
        if (cancelled) return;

        // ZI Pay returns here with only a one-time result id + token. The
        // payment details (provider/amount/trxId/payer) never touch the URL —
        // the backend resolves them server-to-server from the gateway.
        const resultId = searchParams.get("resultId") || "";
        const token = searchParams.get("token") || "";
        if (!resultId || !token) {
          setErrorMsg("Invalid payment link. Please go back to checkout and try again.");
          setStatus("error");
          return;
        }
        if (cancelled) return;

        // Resolve the payment result via our own backend, which calls the
        // gateway server-to-server (one-time token, verified + consumed there).
        const resolveRes = await apiPublic.post("/payment-resolve", { resultId, token });
        if (!resolveRes.data?.data) {
          throw new Error("Could not confirm payment. Please go back and try again.");
        }
        if (cancelled) return;

        const resolved: ResolvedPayment = resolveRes.data.data;

        // Order number generated at checkout and shown on the invoice — reuse
        // it so the created order keeps the exact number the customer saw.
        const orderId = resolved.orderId || checkout.orderId || "";

        const response = await apiPublic.post("/orders", {
          email: checkout.email,
          username: checkout.username || "",
          payerNumber: resolved.payerNumber,
          trxId: resolved.trxId,
          paymentMethod: resolved.provider,
          orderId: orderId || undefined,
          items: checkout.cart.map((item) => ({
            productId: item.dbId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category,
            smmProvider: item.smmProvider,
            smmServiceId: item.smmServiceId,
            link: item.link,
            details: item.details,
            customData: item.customData || {},
            orderFields: item.orderFields,
          })),
          totalAmount: resolved.amount || checkout.totalAmount,
          couponCode: checkout.couponCode || "",
        });

        if (!cancelled) {
          // Order placed — empty the cart and drop the persisted checkout
          // snapshot so a refresh (or the ShopContext restore effect) can't
          // bring the just-purchased items back into the cart.
          setCart([]);
          try {
            localStorage.removeItem("zi-pay-checkout-data");
          } catch { /* Non-blocking */ }

          const orderId = response.data?.data?.orderNumber || response.data?.data?.orderId || "";
          navigate("/order/success" + (orderId ? `?order_id=${orderId}` : ""), { replace: true });
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          (err as any)?.response?.data?.message ||
          (err as any)?.response?.data?.error ||
          (err instanceof Error ? err.message : "Failed to process payment confirmation");
        setErrorMsg(msg);
        setStatus("error");
      }
    };

    run();
    return () => { cancelled = true; };
  }, [navigate, searchParams]);

  if (status === "loading") {
    return (
      <section className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-500">Confirming your payment...</p>
      </section>
    );
  }

  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Payment Confirmation Failed</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{errorMsg}</p>
        <a
          href="/checkout"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:opacity-90"
        >
          Back to checkout
        </a>
      </div>
    </section>
  );
}

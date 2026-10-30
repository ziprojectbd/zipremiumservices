import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
  productType?: 'standard' | 'smm' | 'captchamaster';
  captchamasterPlanId?: string;
  campaignPrice?: number;
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
  const { setCart, cart, validateCart, showAlert } = useShopContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [orderId, setOrderId] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // Read the cart + order context that was saved before redirecting to ZI Pay.
        const raw = localStorage.getItem("zi-pay-checkout-data");
        if (!raw) {
          setStatus("error");
          setErrorMsg("No payment data found. Please go back and try again.");
          return;
        }
        if (cancelled) return;

        const checkout: CheckoutData = JSON.parse(raw);
        if (!checkout?.cart?.length || !checkout.email) {
          setStatus("error");
          setErrorMsg("Payment data is incomplete. Please go back to checkout.");
          return;
        }
        if (cancelled) return;

        // Server-side expiration check before placing the order from the
        // persisted snapshot: an expired discount must not survive the gateway
        // round-trip.
        const validation = await validateCart({ email: checkout.email });
        if (validation?.removedItems?.length) {
          showAlert('warning', 'Offer expired', 'Some discounted items expired while you were paying. Please review your cart and try again.');
          setStatus('error');
          setErrorMsg('Some discounted items expired while you were paying.');
          return;
        }

        // Build the order payload from the persisted checkout snapshot.
        const placeOrder = async (resolved?: ResolvedPayment) => {
          const orderNumber = (resolved?.orderId || checkout.orderId || "").toString().trim();
          const response = await apiPublic.post("/orders", {
            email: checkout.email,
            username: checkout.username || "",
            payerNumber: resolved?.payerNumber || checkout.payerNumber || "",
            trxId: resolved?.trxId || "",
            paymentMethod: resolved?.provider || checkout.paymentMethod,
            orderId: orderNumber || undefined,
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
              productType: item.productType,
              captchamasterPlanId: item.captchamasterPlanId,
              campaignPrice: item.campaignPrice,
            })),
            totalAmount: resolved?.amount || checkout.totalAmount,
            couponCode: checkout.couponCode || "",
          });
          const createdOrderId =
            response.data?.data?.orderNumber || response.data?.data?.orderId || "";
          if (!cancelled) {
            setOrderId(createdOrderId);
            setCart([]);
            try {
              localStorage.removeItem("zi-pay-checkout-data");
            } catch { /* Non-blocking */ }
            setStatus("success");
          }
        };

        // ZI Pay returns here with only a one-time result id + token. The
        // payment details (provider/amount/trxId/payer) never touch the URL —
        // the backend resolves them server-to-server from the gateway.
        const resultId = searchParams.get("resultId") || "";
        const token = searchParams.get("token") || "";

        if (resultId && token) {
          // Resolve the payment result via our own backend, which calls the
          // gateway server-to-server (one-time token, verified + consumed there).
          // If the gateway can't confirm it (already used, not found, unreachable),
          // fall through to submitting as pending for manual admin review.
          let resolved: ResolvedPayment | undefined;
          try {
            const resolveRes = await apiPublic.post("/payment-resolve", { resultId, token });
            if (resolveRes.data?.data) {
              resolved = resolveRes.data.data;
            }
          } catch {
            // Gateway resolution failed — submit as pending for admin review.
          }
          if (cancelled) return;
          await placeOrder(resolved);
        } else {
          // No ZI Pay redirect context — submit the order as pending for
          // manual admin review. The customer's payment info is recorded and
          // the admin will verify it soon.
          await placeOrder();
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          (err as any)?.response?.data?.message ||
          (err as any)?.response?.data?.error ||
          (err instanceof Error ? err.message : "Failed to submit your order");
        setErrorMsg(msg);
        setStatus("error");
      }
    };

    run();
    return () => { cancelled = true; };
  }, [searchParams]);

  // Countdown redirect to home page after payment success
  useEffect(() => {
    if (status !== "success") return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, navigate]);

  if (status === "loading") {
    return (
      <section className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-500">Confirming your payment...</p>
      </section>
    );
  }

  if (status === "success") {
    return (
      <section className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Order Submitted</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Your payment info has been submitted successfully. Our admin team will review your order soon.
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Order ID: {orderId}
            </p>
          )}
          <p className="text-xs text-gray-400 mb-6">
            Redirecting to home in {countdown}s…
          </p>
        </div>
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Order Submission Failed</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{errorMsg}</p>
      </div>
    </section>
  );
}

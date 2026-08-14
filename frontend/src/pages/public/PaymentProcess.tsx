import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import api from "../../lib/axios";
import { useShopContext } from "../../store/ShopContext";

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

        // The trxId comes back from ZI Pay as a query param (cross-origin sessionStorage is unavailable).
        const paymentTrxId = searchParams.get("trxId") || "";
        const paymentPayerNumber = searchParams.get("payerNumber") || "";
        const paymentMethod = searchParams.get("provider") || checkout.paymentMethod;
        // Order number generated at checkout and shown on the invoice — reuse it
        // so the created order keeps the exact number the customer saw.
        const orderId = searchParams.get("orderId") || checkout.orderId || "";

        const response = await api.post("/orders", {
          email: checkout.email,
          username: checkout.username || "",
          payerNumber: paymentPayerNumber,
          trxId: paymentTrxId,
          paymentMethod,
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
          totalAmount: checkout.totalAmount,
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
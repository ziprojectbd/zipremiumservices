import { devLog } from '../../utils/devLogger';
import { getPublicIP } from '../../lib/client-ip';

import * as React from "react";
import { useNavigate } from "react-router-dom";
import type { CartItem } from "../../types";
import { useShopContext } from "../../store/ShopContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/axios";
import OrderSummary from "../../components/public/checkout/OrderSummary";
import CouponInput from "../../components/public/checkout/CouponInput";
import PaymentMethod from "../../components/public/checkout/PaymentMethod";
import PaymentInstructions from "../../components/public/checkout/PaymentInstructions";
import PaymentDetails from "../../components/public/checkout/PaymentDetails";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cart, setCart, paymentMethod, setPaymentMethod,
    payerNumber, setPayerNumber, trxId, setTrxId,
    txHash, setTxHash, copiedAddress, setCopiedAddress,
    getTotalPrice, paymentSettings, getTotalPriceUSD,
    exchangeRate, couponCode, discountAmount, discountType,
    showAlert, cryptoCurrency, setCryptoCurrency,
    paymentType, setPaymentType, selectedNetwork, setSelectedNetwork,
    selectedPlatform, setSelectedPlatform
  } = useShopContext();

  const [submittingOrder, setSubmittingOrder] = React.useState(false);
  const userEmail = user?.email || '';
  const username = user?.username || user?.name || '';

  // Get crypto settings from paymentSettings
  const getCryptoSettings = () => {
    const cryptoPayments = paymentSettings?.cryptoPayments || [];
    const enabledPayments = cryptoPayments.filter((p: any) => p.enabled);

    const networks: Record<string, { enabled: boolean; address: string }> = {};
    const platforms: Record<string, { enabled: boolean; uid: string }> = {};
    const currencies: Record<string, boolean> = {};

    enabledPayments.forEach((p: any) => {
      currencies[p.currency] = true;
      if (p.payType === 'network' && p.network) {
        networks[p.network] = { enabled: true, address: p.address || '' };
      } else if (p.payType === 'uid' && p.platform) {
        platforms[p.platform] = { enabled: true, uid: p.uid || '' };
      }
    });

    return { networks, platforms, currencies };
  };

  const { networks: cryptoNetworksData, platforms: cryptoPlatformsData, currencies: cryptoCurrenciesData } = getCryptoSettings();

  // Set initial crypto values from paymentSettings
  React.useEffect(() => {
    if (paymentSettings?.cryptoCurrencies && Object.keys(paymentSettings.cryptoCurrencies).length > 0) {
      const firstCurrency = Object.keys(paymentSettings.cryptoCurrencies).find(k => paymentSettings.cryptoCurrencies[k]);
      if (firstCurrency && !cryptoCurrency) {
        setCryptoCurrency(firstCurrency);
      }
    }
    if (paymentSettings?.customNetworks && Object.keys(paymentSettings.customNetworks).length > 0) {
      const firstNetwork = Object.keys(paymentSettings.customNetworks).find(k => paymentSettings.customNetworks[k]?.enabled);
      if (firstNetwork && !selectedNetwork) {
        setSelectedNetwork(firstNetwork);
      }
    }
    if (paymentSettings?.customPlatforms && Object.keys(paymentSettings.customPlatforms).length > 0) {
      const firstPlatform = Object.keys(paymentSettings.customPlatforms).find(k => paymentSettings.customPlatforms[k]?.enabled);
      if (firstPlatform && !selectedPlatform) {
        setSelectedPlatform(firstPlatform);
      }
    }
  }, [paymentSettings]);

  // Auto-select first network when paycrypto is selected
  React.useEffect(() => {
    if (paymentMethod === 'paycrypto' && paymentType === 'network' && cryptoNetworksData) {
      const firstNetwork = Object.keys(cryptoNetworksData).find(k => cryptoNetworksData[k]?.enabled);
      if (firstNetwork && !selectedNetwork) {
        setSelectedNetwork(firstNetwork);
      }
    }
    if (paymentMethod === 'paycrypto' && paymentType === 'uid' && cryptoPlatformsData) {
      const firstPlatform = Object.keys(cryptoPlatformsData).find(k => cryptoPlatformsData[k]?.enabled);
      if (firstPlatform && !selectedPlatform) {
        setSelectedPlatform(firstPlatform);
      }
    }
  }, [paymentMethod, paymentType, cryptoNetworksData, cryptoPlatformsData]);

  // Get payment instructions based on selected payment method
  const getPaymentInstructions = () => {
    if (!paymentSettings?.mobilePayments) return { instructions: '', warningInstructions: '' };

    const methodMap: Record<string, string> = {
      'bkash': 'bKash',
      'nagad': 'Nagad',
      'rocket': 'Rocket',
      'upay': 'UPay',
      'tap': 'Tap'
    };

    const methodName = methodMap[paymentMethod] || paymentMethod;
    const payment = paymentSettings.mobilePayments.find(
      (p: any) => p.method.toLowerCase() === methodName.toLowerCase() && p.enabled
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
  const hasCartItems = cart.length > 0;
  const isPayCrypto = paymentMethod === "paycrypto";
  // All wallet payments (bKash, Nagad, Rocket, UPay, Tap) are handled by the
  // ZI Pay gateway — the mobile branch is simply "anything that isn't crypto".
  const isBDMobileMethod = !isPayCrypto;
  // For mobile payments the gateway collects payer number + TRX ID, so they aren't required here.
  const payerFilled = isPayCrypto
    ? (paymentType === 'uid' ? /^\d{9,}$/.test(payerNumber.trim()) : payerNumber.trim().length >= 10)
    : true;
  const trxFilled = (isPayCrypto && paymentType === 'network') ? trxId.trim().length >= 6 : true;

  const canConfirm: boolean = Boolean(
    hasCartItems &&
    payerFilled &&
    trxFilled &&
    (!isPayCrypto ||
      (paymentType && (paymentType === "network" ? selectedNetwork : selectedPlatform)))
  );

  const handleConfirm = async () => {
    if (!canConfirm || submittingOrder) return;

    // SMM items must have a link (or order fields for Website Traffic)
    const missingLink = cart.find(
      (i) => {
        if (i.smmProvider !== 'oneservicebd') return false;
        // Website Traffic with order fields doesn't need link field
        if (i.category === 'Website Traffic' && i.smmServiceId !== '8629' && i.orderFields?.length) return false;
        return !i.link?.trim();
      }
    );
    if (missingLink) {
      showAlert('warning', 'Link Required', `Please provide a target link/username for "${missingLink.name}" before proceeding.`);
      return;
    }

    const effectiveEmail = userEmail?.trim();
    if (!effectiveEmail) {
      showAlert('error', 'Email Required', 'Please sign in first. Email is required to place an order.');
      return;
    }

    // For all mobile wallet payments (bKash, Nagad, Rocket, UPay, Tap) — send
    // the customer to the ZI Pay gateway, which shows a wallet picker, mints a
    // secure one-time invoice, and returns them to /payment/process afterward.
    if (isBDMobileMethod) {
      // Whole-taka BDT total — the same integer the server computes and the
      // ZI-Pay invoice must display/charge.
      const total = Math.round(getTotalPrice());
      const payGatewayBase = import.meta.env.VITE_ZIPAY_URL || 'https://pay.zipremiumservices.com';
      // Generate the order number here (same ORD-xxx format the backend uses)
      // so the invoice shows it and /payment/process can reuse the exact number.
      const ts = Date.now().toString(36).toUpperCase();
      const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
      const orderId = `ORD-${ts}${rand}`;
      // The gateway resolves the return URL (/payment/process) from its own
      // VITE_MAIN_SITE_URL config — no callback URL passes through here.
      // Store the order context on THIS origin so /payment/process can read it back.
      const checkoutPayload = {
        email: effectiveEmail,
        username,
        paymentMethod,
        totalAmount: total,
        orderId,
        cart,
        couponCode: couponCode || '',
        couponDiscount: discountAmount,
        couponType: discountType,
      };
      localStorage.setItem('zi-pay-checkout-data', JSON.stringify(checkoutPayload));

      setSubmittingOrder(true);
      // Create a short-lived server-side payment session on the gateway so the
      // amount + orderId never appear in the browser URL. Redirect to the
      // gateway picker with only the session token.
      try {
        const sessionRes = await fetch(`${payGatewayBase}/api/payment-sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: total, orderId, email: effectiveEmail }),
        });
        const sessionData = await sessionRes.json().catch(() => ({}));
        if (!sessionRes.ok || !sessionData?.data?.sessionToken) {
          showAlert('error', 'Payment Unavailable', 'Could not start a payment session. Please try again.');
          setSubmittingOrder(false);
          return;
        }
        const { sessionToken } = sessionData.data;
        // window.location.replace so the checkout page isn't left in back-history.
        window.location.replace(`${payGatewayBase}/payment/choose?session=${encodeURIComponent(sessionToken)}`);
      } catch {
        showAlert('error', 'Payment Unavailable', 'Could not reach the payment gateway. Please try again.');
        setSubmittingOrder(false);
      }
      return;
    }

    setSubmittingOrder(true);
    try {
      // Get client public IP (best-effort, used for geo-location)
      const clientIP = await getPublicIP();

      // Extract P2P trade data from cart if present
      const p2pItem = cart.find(item => (item as any).p2pToken);
      const p2pData = p2pItem ? {
        p2pToken: (p2pItem as any).p2pToken || '',
        p2pNetwork: (p2pItem as any).p2pNetwork || '',
        p2pWalletAddress: (p2pItem as any).p2pWalletAddress || '',
      } : {};

      const response = await api.post('/orders', {
        email: effectiveEmail,
        username,
        payerNumber: isPayCrypto ? '' : payerNumber,
        walletAddress: isPayCrypto && paymentType === 'network' ? payerNumber : '',
        senderUid: isPayCrypto && paymentType === 'uid' ? payerNumber : '',
        txHash: isPayCrypto && paymentType === 'network' ? (txHash || trxId) : '',
        trxId: isPayCrypto ? '' : trxId,
        paymentMethod,
        cryptoCurrency: isPayCrypto ? (cryptoCurrency || 'USDT') : '',
        paymentType,
        selectedNetwork,
        selectedPlatform,
        items: cart.map((item) => ({
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
        totalAmount: isPayCrypto ? Math.round(getTotalPriceUSD()) : Math.round(getTotalPrice()),
        couponCode: couponCode || '',
        couponDetails: couponCode ? {
          code: couponCode,
          discountAmount,
          discountType,
        } : undefined,
        ...p2pData,
      }, {
        headers: {
          ...(clientIP ? { 'x-client-ip': clientIP } : {}),
        },
      });

      const data = response.data;
      if (!data?.success) {
        devLog('Order creation failed:', data);
        throw new Error(data?.error || 'Failed to create order');
      }

      setCart([]);
      setPayerNumber('');
      setTrxId('');
      setTxHash('');
      setCryptoCurrency('');
      setPaymentType('network');
      setSelectedNetwork('');
      setSelectedPlatform('');
      showAlert(
        'success',
        'Order Submitted',
        'Thank you! Your order has been submitted. We will verify payment and contact you shortly.',
        () => navigate('/order/success')
      );
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || (error instanceof Error ? error.message : 'Failed to submit order');
      console.log('Order creation failed - full error:', error);
      console.log('Response status:', error?.response?.status);
      console.log('Response data:', JSON.stringify(error?.response?.data));
      showAlert(
        'error',
        'Order Failed',
        msg
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 py-10 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order summary */}
          <div className="lg:col-span-2 space-y-6">
            <OrderSummary cart={cart} getTotalPrice={getTotalPrice} getTotalPriceUSD={getTotalPriceUSD} paymentMethod={paymentMethod} exchangeRate={exchangeRate} />

            {/* Coupon Code */}
            <CouponInput />

            {/* Payment method */}
            <PaymentMethod
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              paymentSettings={paymentSettings}
            />

            {/* Payment Instructions — only shown for crypto, which is still handled on-site.
                All mobile wallet payments go through the ZI Pay gateway, which shows its own instructions. */}
            {isPayCrypto && (
            <PaymentInstructions
              paymentMethod={paymentMethod}
              getTotalPrice={getTotalPrice}
              getTotalPriceUSD={getTotalPriceUSD}
              exchangeRate={exchangeRate}
              cryptoCurrency={cryptoCurrency}
              setCryptoCurrency={setCryptoCurrency}
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              selectedNetwork={selectedNetwork}
              setSelectedNetwork={setSelectedNetwork}
              selectedPlatform={selectedPlatform}
              setSelectedPlatform={setSelectedPlatform}
              copiedAddress={copiedAddress}
              setCopiedAddress={setCopiedAddress}
              txHash={txHash}
              setTxHash={setTxHash}
              paymentInstructions={paymentInstructionsData}
              warningInstructions={warningInstructionsData}
              paymentNumber={paymentNumber}
              paymentMerchantName={paymentMerchantName}
              paymentNumberType={paymentNumberType}
              cryptoNetworks={cryptoNetworksData}
              cryptoPlatforms={cryptoPlatformsData}
              cryptoCurrencies={cryptoCurrenciesData}
            />
            )}
          </div>

          {/* Mobile payments — single button that sends the customer to the ZI Pay
              gateway, which collects the wallet choice + payment details securely. */}
          {isBDMobileMethod && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-xs sm:text-sm text-gray-300 bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-2 sm:px-3 sm:py-2 mb-3">
                You will be redirected to the secure payment gateway to choose your wallet (bKash, Nagad, Rocket, UPay, Tap) and complete payment.
              </div>
              <button
                type="button"
                disabled={!canConfirm || submittingOrder}
                onClick={handleConfirm}
                className={`w-full inline-flex items-center justify-center px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-60 ${
                  canConfirm && !submittingOrder
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
                }`}
              >
                {submittingOrder ? "Redirecting..." : "Continue to Payment"}
              </button>
            </div>
          )}

          {/* Crypto payment details — only shown for crypto payments */}
          {isPayCrypto && (
            <PaymentDetails
              paymentMethod={paymentMethod}
              payerNumber={payerNumber}
              setPayerNumber={setPayerNumber}
              trxId={trxId}
              setTrxId={setTrxId}
              txHash={txHash}
              setTxHash={setTxHash}
              canConfirm={canConfirm && !submittingOrder}
              onConfirm={handleConfirm}
              paymentType={paymentType}
            />
          )}
        </div>
      </div>
    </section>
  );
}

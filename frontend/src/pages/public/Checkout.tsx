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
    removeCoupon, showAlert, cryptoCurrency, setCryptoCurrency,
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
  const mobileMethodIds = (paymentSettings?.mobilePayments || [])
    .filter((p: any) => p.enabled)
    .map((p: any) => p.method.toLowerCase());
  const isBDMobileMethod = mobileMethodIds.includes(paymentMethod.toLowerCase());
  const payerFilled = isPayCrypto
    ? payerNumber.trim().length >= 10
    : payerNumber.trim().length >= 6;
  const trxFilled = trxId.trim().length >= 6;

  const canConfirm: boolean = Boolean(
    hasCartItems &&
    payerFilled &&
    ((isBDMobileMethod || (isPayCrypto && paymentType === "network")) ? trxFilled : true) &&
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
        walletAddress: payerNumber,
        senderUid: isPayCrypto && paymentType === 'uid' ? payerNumber : '',
        txHash: txHash || trxId,
        trxId,
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
        totalAmount: isPayCrypto ? getTotalPriceUSD() : getTotalPrice(),
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
      removeCoupon();
      showAlert(
        'success',
        'Order Submitted',
        'Thank you! Your order has been submitted. We will verify payment and contact you shortly.',
        () => navigate('/order/success')
      );
    } catch (error) {
      showAlert(
        'error',
        'Order Failed',
        error instanceof Error ? error.message : 'Failed to submit order'
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">
            Checkout
          </h2>
          <p className="text-gray-400">
            Complete your purchase securely
          </p>
        </div>
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

            {/* Payment Instructions */}
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
          </div>

          {/* Payment details */}
          {(isBDMobileMethod || isPayCrypto) && (
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

import React from "react";
import { Copy } from "lucide-react";
import { useShopContext } from "../../../store/ShopContext";
import { formatPrice } from "../../../utils/formatPrice";

interface PaymentInstructionsProps {
  paymentMethod: string;
  getTotalPrice: () => number;
  getTotalPriceUSD?: () => number;
  exchangeRate?: number;
  cryptoCurrency?: string;
  setCryptoCurrency?: (value: string) => void;
  paymentType?: "network" | "uid";
  setPaymentType?: (value: "network" | "uid") => void;
  selectedNetwork?: string;
  setSelectedNetwork?: (value: string) => void;
  selectedPlatform?: string;
  setSelectedPlatform?: (value: string) => void;
  copiedAddress: boolean;
  setCopiedAddress: (value: boolean) => void;
  txHash: string;
  setTxHash: (value: string) => void;
  paymentInstructions?: string;
  warningInstructions?: string;
  paymentNumber?: string;
  paymentMerchantName?: string;
  paymentNumberType?: string;
  cryptoNetworks?: Record<string, { enabled: boolean; address: string }>;
  cryptoPlatforms?: Record<string, { enabled: boolean; uid: string }>;
  cryptoCurrencies?: Record<string, boolean>;
}

export default function PaymentInstructions({
  paymentMethod,
  getTotalPrice,
  getTotalPriceUSD,
  exchangeRate = 110,
  cryptoCurrency = "USDT",
  setCryptoCurrency = () => {},
  paymentType = "network",
  setPaymentType = () => {},
  selectedNetwork = "TRC20",
  setSelectedNetwork = () => {},
  selectedPlatform = "Binance",
  setSelectedPlatform = () => {},
  copiedAddress,
  setCopiedAddress,
  txHash,
  setTxHash,
  paymentInstructions = "",
  warningInstructions = "",
  paymentNumber = "",
  paymentMerchantName = "",
  paymentNumberType = "merchant",
  cryptoNetworks = {},
  cryptoPlatforms = {},
  cryptoCurrencies = {}
}: PaymentInstructionsProps) {

  const { paymentSettings, showAlert } = useShopContext();
  const mobileMethodIds = (paymentSettings?.mobilePayments || [])
    .filter((p: any) => p.enabled)
    .map((p: any) => p.method.toLowerCase());

  const isBangladeshiPayment = (method: string) => {
    return mobileMethodIds.includes(method.toLowerCase());
  };

  const getPaymentMethodName = (method: string) => {
    const payment = (paymentSettings?.mobilePayments || [])
      .find((p: any) => p.method.toLowerCase() === method.toLowerCase());
    if (payment?.method) return payment.method;
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const maskPhoneNumber = (number: string) => {
    if (!number || number.length < 7) return number;
    const first = number.slice(0, 4);
    const last = number.slice(-2);
    return `${first}XXXXX${last}`;
  };

  const isPayCrypto = paymentMethod === "paycrypto";
  const isBDMobile = isBangladeshiPayment(paymentMethod);

  React.useEffect(() => {
    if (isPayCrypto && !getTotalPriceUSD) {
      showAlert('error', 'Price Error', 'USD price data is not available for crypto payment. Please try again.');
    }
  }, [isPayCrypto, getTotalPriceUSD]);

  if (isBDMobile) {
    const methodName = getPaymentMethodName(paymentMethod);
    const methodColors: { [key: string]: { border: string, bg: string, text: string } } = {
      'bkash': { border: 'border-pink-200 dark:border-pink-400/30', bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400' },
      'nagad': { border: 'border-orange-200 dark:border-orange-400/30', bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400' },
      'rocket': { border: 'border-blue-200 dark:border-blue-400/30', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
      'upay': { border: 'border-purple-200 dark:border-purple-400/30', bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
      'tap': { border: 'border-green-200 dark:border-green-400/30', bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400' }
    };

    const colors = methodColors[paymentMethod.toLowerCase()] || methodColors['bkash'];
    if (!paymentNumber) {
      return (
        <div className={`mt-2 rounded-xl border ${colors.border} ${colors.bg} p-4`}>
          <div className="text-sm text-gray-400">
            No payment configuration found. Please contact support.
          </div>
        </div>
      );
    }

    return (
      <div className={`mt-2 rounded-xl border ${colors.border} ${colors.bg} p-3 sm:p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-200">
              {methodName} Number
              <span className="ml-2 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/20 text-gray-600 dark:text-gray-400">
                {paymentNumberType.charAt(0).toUpperCase() + paymentNumberType.slice(1)}
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white allow-copy break-all">
              {maskPhoneNumber(paymentNumber)}
            </div>
          </div>
          {paymentNumber && (
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(paymentNumber)}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg bg-white dark:bg-transparent ${colors.text} border ${colors.border} hover:opacity-80 flex-shrink-0`}
            >
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Copy</span>
            </button>
          )}
        </div>
        {paymentInstructions && (
          <ul className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-700 dark:text-gray-200 list-disc pl-4 sm:pl-5 space-y-0.5 sm:space-y-1">
            {paymentInstructions.split('\n').filter(line => line.trim()).map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        )}

        {warningInstructions && (
          <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-400/30 rounded-lg">
            <div className="text-xs sm:text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1.5 sm:mb-2">
              ⚠️ Important Instructions:
            </div>
            <ul className="text-[10px] sm:text-xs text-yellow-700 dark:text-yellow-300 space-y-0.5 sm:space-y-1">
              {warningInstructions.split('\n').filter(line => line.trim()).map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (isPayCrypto) {
    return (
      <div className="mt-2 rounded-xl border border-purple-200 dark:border-purple-400/30 bg-purple-50 dark:bg-purple-500/10 p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Currency
            </label>
            <select
              value={cryptoCurrency}
              onChange={(e) => setCryptoCurrency(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-slate-900/60 border-white/10 text-white"
            >
              {Object.entries(cryptoCurrencies || {})
                .filter(([_, enabled]) => enabled)
                .map(([currency]) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              {(!cryptoCurrencies || Object.values(cryptoCurrencies).every(v => !v)) && (
                <option value="">No currencies configured</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pay Via
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as "network" | "uid")}
              className="w-full px-3 py-2 border rounded-lg bg-slate-900/60 border-white/10 text-white"
            >
              <option value="network">Network</option>
              <option value="uid">UID</option>
            </select>
          </div>

          {paymentType === "network" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Network
              </label>
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-slate-900/60 border-white/10 text-white"
              >
                {Object.entries(cryptoNetworks || {})
                  .filter(([_, network]) => network.enabled)
                  .map(([network]) => (
                    <option key={network} value={network}>{network}</option>
                  ))}
                {(!cryptoNetworks || Object.values(cryptoNetworks).every(v => !v.enabled)) && (
                  <option value="">No networks configured</option>
                )}
              </select>

              <div className="mt-3">
                <label className="block text-sm text-gray-300 mb-1">
                  Payment Address
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cryptoNetworks[selectedNetwork]?.address || ''}
                    readOnly
                    placeholder="No address configured"
                    className="flex-1 px-3 py-2 border rounded-lg bg-slate-900/60 border-white/10 text-white font-mono text-sm"
                  />
                  {cryptoNetworks[selectedNetwork]?.address && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(cryptoNetworks[selectedNetwork]?.address || '');
                        setCopiedAddress(true);
                        setTimeout(() => setCopiedAddress(false), 2000);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white dark:bg-transparent text-purple-600 border border-purple-200 dark:border-purple-400/40 hover:bg-purple-100 dark:hover:bg-purple-500/10"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedAddress ? "Copied!" : "Copy"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {paymentType === "uid" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Platform
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-slate-900/60 border-white/10 text-white"
              >
                {Object.entries(cryptoPlatforms || {})
                  .filter(([_, platform]) => platform.enabled)
                  .map(([platform]) => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                {(!cryptoPlatforms || Object.values(cryptoPlatforms).every(v => !v.enabled)) && (
                  <option value="">No platforms configured</option>
                )}
              </select>

              <div className="mt-3">
                <label className="block text-sm text-gray-300 mb-1">
                  Payment UID
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cryptoPlatforms[selectedPlatform]?.uid || ''}
                    readOnly
                    placeholder="No UID configured"
                    className="flex-1 px-3 py-2 border rounded-lg bg-slate-900/60 border-white/10 text-white font-mono text-sm"
                  />
                  {cryptoPlatforms[selectedPlatform]?.uid && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(cryptoPlatforms[selectedPlatform]?.uid || '');
                        setCopiedAddress(true);
                        setTimeout(() => setCopiedAddress(false), 2000);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white dark:bg-transparent text-purple-600 border border-purple-200 dark:border-purple-400/40 hover:bg-purple-100 dark:hover:bg-purple-500/10"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedAddress ? "Copied!" : "Copy"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-slate-900/60 rounded-lg border border-white/10">
            <ul className="text-sm text-gray-200 list-disc pl-5 space-y-1">
              <li>Send exact amount: {getTotalPriceUSD ? `$${formatPrice(getTotalPriceUSD(), 2)}` : <span className="text-red-400">USD price unavailable</span>}</li>
              <li>Transaction hash will be your receipt</li>
              <li>Payment will be verified manually for security</li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-400/30 rounded-lg">
            <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
              ⚠️ Important Instructions:
            </div>
            {warningInstructions ? (
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                {warningInstructions.split('\n').filter(line => line.trim()).map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            ) : (
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>Before sending dollar, please check address, network and amount twice</li>
                <li>Authority will not be responsible for sending dollar to wrong address</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

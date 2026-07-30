import React, { useState } from "react";
import { Wallet } from "lucide-react";

interface PaymentMethodProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  paymentSettings?: any;
}

const methodColors: Record<string, { border: string; bg: string; text: string; icon: string }> = {
  bkash: { border: 'border-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', icon: 'Wallet' },
  nagad: { border: 'border-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', icon: 'Wallet' },
  rocket: { border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: 'Wallet' },
  upay: { border: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: 'Wallet' },
  tap: { border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400', icon: 'Wallet' },
  paycrypto: { border: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: 'Crypto' },
};

export default function PaymentMethod({
  paymentMethod,
  setPaymentMethod,
  paymentSettings,
}: PaymentMethodProps) {
  const [showCryptoOnly, setShowCryptoOnly] = useState(false);

  const getEnabledPaymentMethods = () => {
    const methods: { id: string; name: string; description: string }[] = [];
    const addedIds = new Set<string>();

    if (!showCryptoOnly && paymentSettings?.mobilePayments) {
      paymentSettings.mobilePayments
        .filter((p: any) => p.enabled)
        .forEach((p: any) => {
          const id = p.method.toLowerCase();
          if (!addedIds.has(id)) {
            addedIds.add(id);
            methods.push({
              id,
              name: p.method,
              description: p.numberType ? p.numberType.charAt(0).toUpperCase() + p.numberType.slice(1) : 'Payment'
            });
          }
        });
    }

    if (showCryptoOnly && paymentSettings?.cryptoPayments) {
      const hasEnabled = paymentSettings.cryptoPayments.some((p: any) => p.enabled);
      if (hasEnabled) {
        methods.push({
          id: 'paycrypto',
          name: 'Crypto / USDT',
          description: 'Pay with cryptocurrency',
        });
      }
    }

    return methods;
  };

  const enabledMethods = getEnabledPaymentMethods();

  if (enabledMethods.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-xl font-semibold text-white">Payment Method</h3>
          {showCryptoOnly && (
            <button
              type="button"
              onClick={() => {
                setShowCryptoOnly(false);
                setPaymentMethod('bkash');
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-full border bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-500/30 text-pink-400"
            >
              Pay with Mobile
            </button>
          )}
        </div>
        <div className="text-sm text-gray-400">
          No payment methods configured. Please contact support.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 p-2.5 sm:p-3 md:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-2.5 sm:mb-3 md:mb-4">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white">Payment Method</h3>
        <button
          type="button"
          onClick={() => {
            setShowCryptoOnly(!showCryptoOnly);
            if (!showCryptoOnly) {
              setPaymentMethod('paycrypto');
            } else {
              setPaymentMethod('bkash');
            }
          }}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-[9px] sm:text-[10px] md:text-xs font-semibold rounded-full border transition-all duration-300 self-start sm:self-auto ${
            showCryptoOnly
              ? 'bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-500/30 text-pink-400 hover:from-pink-500/20 hover:to-rose-500/20 hover:border-pink-500/50'
              : 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/30 text-purple-400 hover:from-purple-500/20 hover:to-indigo-500/20 hover:border-purple-500/50'
          }`}
        >
          {showCryptoOnly ? 'Pay with Mobile' : 'Pay with Crypto'}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {enabledMethods.map((method) => {
          const colors = methodColors[method.id] || methodColors[method.id === 'paycrypto' ? 'paycrypto' : 'bkash'];
          const isSelected = paymentMethod === method.id;

          return (
            <label
              key={method.id}
              className={`flex items-center justify-between p-2.5 sm:p-3 md:p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected
                  ? `${colors.border} ${colors.bg}`
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60"
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                {method.id === 'paycrypto' ? (
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-[9px] sm:text-[10px] md:text-xs font-bold flex-shrink-0">
                    B
                  </div>
                ) : ['bkash', 'nagad', 'rocket'].includes(method.id) ? (
                  <img
                    src={`/images/${method.id}-logo.webp`}
                    alt={method.name}
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 object-contain flex-shrink-0"
                  />
                ) : (
                  <Wallet className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ${colors.text} flex-shrink-0`} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs sm:text-sm md:text-base text-gray-900 dark:text-white truncate">{method.name}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-300 truncate">
                    {method.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center ml-2 sm:ml-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                  className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0 cursor-pointer ${
                    isSelected ? 'accent-green-500' : 'accent-gray-300'
                  }`}
                />
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

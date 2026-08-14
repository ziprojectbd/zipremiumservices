import { useState } from "react";
import { Wallet } from "lucide-react";

interface PaymentMethodProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  paymentSettings?: any;
}

export default function PaymentMethod({
  paymentMethod,
  setPaymentMethod,
}: PaymentMethodProps) {
  const [showCryptoOnly, setShowCryptoOnly] = useState(false);
  const isPayCrypto = paymentMethod === "paycrypto";

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 p-2.5 sm:p-3 md:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-2.5 sm:mb-3 md:mb-4">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white">Payment Method</h3>
        <button
          type="button"
          onClick={() => {
            setShowCryptoOnly(!showCryptoOnly);
            setPaymentMethod(showCryptoOnly ? 'bkash' : 'paycrypto');
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

      {isPayCrypto ? (
        <div className="flex items-center gap-3 p-3 sm:p-4 border rounded-xl border-purple-500 bg-purple-50 dark:bg-purple-500/10">
          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-[9px] sm:text-[10px] md:text-xs font-bold flex-shrink-0">
            B
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-xs sm:text-sm md:text-base text-gray-900 dark:text-white">Crypto / USDT</div>
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-300">Pay with cryptocurrency</div>
          </div>
          <div className="flex items-center ml-2 sm:ml-3">
            <input
              type="radio"
              name="payment"
              checked
              readOnly
              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0 cursor-pointer accent-green-500"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 sm:p-4 border rounded-xl border-pink-500 bg-pink-50 dark:bg-pink-500/10">
          <img
            src="/images/bkash-logo.webp"
            alt="bKash"
            className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 object-contain flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-xs sm:text-sm md:text-base text-gray-900 dark:text-white">Mobile Payment</div>
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-300">
              bKash, Nagad, Rocket &amp; more — pay securely via gateway
            </div>
          </div>
          <div className="flex items-center ml-2 sm:ml-3">
            <input
              type="radio"
              name="payment"
              checked
              readOnly
              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0 cursor-pointer accent-green-500"
            />
          </div>
        </div>
      )}

      {!isPayCrypto && (
        <div className="mt-2.5 sm:mt-3 flex items-start gap-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          <Wallet className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            You will be redirected to the secure payment gateway to choose your wallet
            (bKash, Nagad, Rocket, UPay, Tap) and complete payment.
          </span>
        </div>
      )}
    </div>
  );
}

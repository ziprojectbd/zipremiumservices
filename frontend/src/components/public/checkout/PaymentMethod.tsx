interface PaymentMethodProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  paymentSettings?: any;
}

export default function PaymentMethod({
  paymentMethod,
  setPaymentMethod,
}: PaymentMethodProps) {
  const isPayCrypto = paymentMethod === "paycrypto";

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 p-2.5 sm:p-3 md:p-4 lg:p-6">
      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2.5 sm:mb-3 md:mb-4">
        Payment Method
      </h3>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
        {/* Mobile Payment */}
        <button
          type="button"
          onClick={() => setPaymentMethod('bkash')}
          aria-pressed={!isPayCrypto}
          className={`flex flex-col items-center text-center gap-2 p-2.5 sm:p-4 border rounded-xl transition-all duration-300 ${
            !isPayCrypto
              ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/10'
              : 'border-white/10 bg-white/5 hover:border-pink-500/40 hover:bg-pink-500/5'
          }`}
        >
          <img
            src="/images/bkash-logo.webp"
            alt="bKash"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain"
          />
          <div className="font-semibold text-xs sm:text-sm md:text-base text-white">Mobile Payment</div>
          <div className="text-[9px] sm:text-[11px] md:text-xs text-gray-400 leading-tight">
            bKash, Nagad, Rocket &amp; more
          </div>
          <span
            className={`mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center ${
              !isPayCrypto ? 'border-pink-500' : 'border-gray-500'
            }`}
          >
            {!isPayCrypto && <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />}
          </span>
        </button>

        {/* Crypto Payment */}
        <button
          type="button"
          onClick={() => setPaymentMethod('paycrypto')}
          aria-pressed={isPayCrypto}
          className={`flex flex-col items-center text-center gap-2 p-2.5 sm:p-4 border rounded-xl transition-all duration-300 ${
            isPayCrypto
              ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
              : 'border-white/10 bg-white/5 hover:border-purple-500/40 hover:bg-purple-500/5'
          }`}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm sm:text-base md:text-lg font-bold">
            B
          </div>
          <div className="font-semibold text-xs sm:text-sm md:text-base text-white">Crypto Payment</div>
          <div className="text-[9px] sm:text-[11px] md:text-xs text-gray-400 leading-tight">
            USDT &amp; other crypto
          </div>
          <span
            className={`mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center ${
              isPayCrypto ? 'border-purple-500' : 'border-gray-500'
            }`}
          >
            {isPayCrypto && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
          </span>
        </button>
      </div>
    </div>
  );
}

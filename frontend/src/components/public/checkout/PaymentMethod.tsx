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
            src="https://res.cloudinary.com/dxilo3mlg/image/upload/v1791131974/10551890_urguxb.png"
            alt="Mobile Payment"
            className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
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
          <img
            src="https://res.cloudinary.com/dxilo3mlg/image/upload/v1791131759/images_x7ayxv.png"
            alt="Crypto Payment"
            className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain rounded-full"
          />
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

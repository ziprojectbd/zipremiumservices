import React, { useState } from "react";
import { useShopContext } from "../../../store/ShopContext";
import { Tag, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function CouponInput() {
  const { couponCode, couponError, applyingCoupon, applyCoupon, getSubtotalPrice } = useShopContext();
  const [inputCode, setInputCode] = useState("");

  const handleApply = async () => {
    const success = await applyCoupon(inputCode);
    if (success) {
      setInputCode("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
        <Tag className="w-5 h-5 text-blue-400" />
        Coupon Code
      </h3>

      {couponCode ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
              <span className="text-white font-semibold">{couponCode}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="Enter coupon code"
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/20 transition-all duration-200 uppercase"
              disabled={applyingCoupon}
            />
          </div>
          <button
            onClick={handleApply}
            disabled={applyingCoupon || !inputCode.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 flex items-center gap-2"
          >
            {applyingCoupon ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Apply"
            )}
          </button>
        </div>
      )}

      {couponError && !couponCode && (
        <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{couponError}</span>
        </div>
      )}
    </div>
  );
}

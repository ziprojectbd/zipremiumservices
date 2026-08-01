import React from "react";
import { useShopContext } from "../../../store/ShopContext";

interface PaymentDetailsProps {
  paymentMethod: string;
  payerNumber: string;
  setPayerNumber: (value: string) => void;
  trxId: string;
  setTrxId: (value: string) => void;
  txHash: string;
  setTxHash: (value: string) => void;
  canConfirm: boolean;
  onConfirm: () => void;
  paymentType?: "network" | "uid";
}

export default function PaymentDetails({
  paymentMethod,
  payerNumber,
  setPayerNumber,
  trxId,
  setTrxId,
  canConfirm,
  onConfirm,
  txHash,
  setTxHash,
  paymentType = "network"
}: PaymentDetailsProps) {

  const { paymentSettings } = useShopContext();
  const isPayCrypto = paymentMethod === "paycrypto";
  const mobileMethodIds = (paymentSettings?.mobilePayments || [])
    .filter((p: any) => p.enabled)
    .map((p: any) => p.method.toLowerCase());
  const isBDMobileMethod = mobileMethodIds.includes(paymentMethod.toLowerCase());
  const isValidBDPhoneStrict = (val: string) => /^\+8801[3-9]\d{8}$/.test(val);
  const showBDPhoneFormat = ['bkash', 'nagad', 'rocket', 'upay', 'tap'].includes(paymentMethod.toLowerCase());

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 p-3 sm:p-4 md:p-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">Payment Details</h3>
      <div className="grid grid-cols-1 gap-3 sm:gap-4">

        {isBDMobileMethod && (
          <>
            <div>
              <label className="block text-xs sm:text-sm text-gray-300 mb-1">
                Your Payment Number
              </label>
              <input
                type={showBDPhoneFormat ? "tel" : "text"}
                value={payerNumber}
                onChange={(e) => {
                  let v = e.target.value;
                  if (showBDPhoneFormat) {
                    v = v.replace(/[^+\d]/g, "");
                    if (v === "+") v = "+880";
                    if (v.startsWith("880")) v = "+" + v;
                    if (v.startsWith("01")) v = "+880" + v.slice(1);
                    if (v.startsWith("1")) v = "+880" + v;
                    if (!v.startsWith("+880")) {
                      if (v === "" || v === "+") v = "+880";
                    }
                    if (v.length > 14) v = v.slice(0, 14);
                  }
                  setPayerNumber(v);
                }}
                placeholder={showBDPhoneFormat ? "+8801XXXXXXXXX" : "Enter your payment number"}
                className="w-full px-3 py-2 sm:px-3 sm:py-2 border rounded-lg bg-slate-900/60 border-white/10 text-white text-sm"
              />
              {payerNumber && showBDPhoneFormat && !isValidBDPhoneStrict(payerNumber) && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-500">
                  Enter a valid Bangladeshi number like +8801XXXXXXXXX.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-300 mb-1">
                Transaction ID / Hash
              </label>
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                placeholder="Enter transaction ID"
                className="w-full px-3 py-2 sm:px-3 sm:py-2 border rounded-lg bg-slate-900/60 border-white/10 text-white text-sm"
              />
            </div>
          </>
        )}

        {isPayCrypto && !isBDMobileMethod && (
          <>
            <div>
              <label className="block text-xs sm:text-sm text-gray-300 mb-1">
                {paymentType === "network" ? "Your Wallet Address" : "Your UID"}
              </label>
              <input
                type="text"
                value={payerNumber}
                onChange={(e) => {
                  let v = e.target.value;
                  if (paymentType === "uid") {
                    v = v.replace(/\D/g, "");
                  }
                  setPayerNumber(v);
                }}
                placeholder={paymentType === "network" ? "Enter your wallet address" : "Enter your UID (min 9 digits)"}
                className="w-full px-3 py-2 sm:px-3 sm:py-2 border rounded-lg bg-slate-900/60 border-white/10 text-white text-sm"
                maxLength={paymentType === "uid" ? 20 : undefined}
              />
              {paymentType === "uid" && payerNumber && payerNumber.length < 9 && (
                <p className="mt-1 text-[10px] sm:text-xs text-amber-400">
                  UID must be at least 9 digits.
                </p>
              )}
            </div>
            {paymentType === "network" && (
              <div>
                <label className="block text-xs sm:text-sm text-gray-300 mb-1">
                  Transaction ID / Hash
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                  placeholder="Enter transaction ID"
                  className="w-full px-3 py-2 sm:px-3 sm:py-2 border rounded-lg bg-slate-900/60 border-white/10 text-white text-sm"
                />
              </div>
            )}
          </>
        )}
      </div>
      <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
        <div className="text-[10px] sm:text-xs text-gray-300 bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-2 sm:px-3 sm:py-2">
          {isBDMobileMethod
            ? "Make sure you have sent to correct account and pasted the correct Transaction ID. Your payment will be verified manually for security."
            : paymentType === "network"
              ? "Wallet Address may be used multiple times, but each on-chain network payment must have a unique Transaction Hash (TXID). Duplicate TXIDs will not be accepted."
              : "Your UID may be used multiple times. Your payment will be verified manually for security."}
        </div>
        <div>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
            className={`w-full mt-1 inline-flex items-center justify-center px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-60 ${
              canConfirm
                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
            }`}
          >
            Confirm Order Securely
          </button>
        </div>
      </div>
    </div>
  );
}

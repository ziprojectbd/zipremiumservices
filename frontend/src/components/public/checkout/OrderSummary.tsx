import React from "react";
import type { CartItem } from "../../../types";
import { useShopContext } from "../../../store/ShopContext";
import { Tag } from "lucide-react";
import { formatPrice, roundCurrency } from "../../../utils/formatPrice";

interface OrderSummaryProps {
  cart: CartItem[];
  getTotalPrice: () => number;
  getTotalPriceUSD?: () => number;
  paymentMethod?: string;
  exchangeRate?: number;
}

export default function OrderSummary({ cart, getTotalPrice, getTotalPriceUSD, paymentMethod, exchangeRate = 110 }: OrderSummaryProps) {
  const { showAlert, couponCode, discountAmount, discountType, getBDTItemAmount } = useShopContext();
  const isCryptoPayment = paymentMethod === 'paycrypto';

  React.useEffect(() => {
    if (isCryptoPayment && !getTotalPriceUSD) {
      showAlert('error', 'Price Error', 'USD price data is not available for crypto payment. Please try again.');
    }
  }, [isCryptoPayment, getTotalPriceUSD]);

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-4 text-white">Order Summary</h3>
      {cart.length === 0 ? (
        <div className="text-gray-400">
          Your cart is empty.
        </div>
      ) : (
        <div className="space-y-4">
          {cart.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-white">{item.name}</div>
                <div className="text-sm text-gray-400">
                  Qty: {item.quantity}
                </div>
                {item.link && item.smmProvider === 'oneservicebd' && (
                  <div className="text-[11px] text-gray-500 truncate max-w-[200px]">
                    Link: {item.link}
                  </div>
                )}
                {item.customData && Object.keys(item.customData).length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {Object.entries(item.customData).map(([key, val]) => (
                      <div key={key} className="text-[11px] text-gray-500">
                        <span className="capitalize">{key.replace(/_/g, ' ')}:</span> {String(val)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="font-semibold text-white">
                {(() => {
                  const isSmm = item.smmProvider === 'oneservicebd';
                  const effectiveQty = isSmm ? item.quantity / 1000 : item.quantity;
                  if (isCryptoPayment) {
                    // Same USD source as getTotalPriceUSD() — use priceUSDT
                    // when available, otherwise convert the BDT price at the
                    // current rate. Both places must agree so a line item
                    // (e.g. $4.25) always matches the order total.
                    const unitUSD = item.priceUSDT || (item.price ? roundCurrency(item.price / exchangeRate) : 0);
                    return <span>${formatPrice(unitUSD * effectiveQty, 2)}</span>;
                  }
                  // BDT: single shared whole-taka amount (same rounding as the
                  // Total) so the line always matches the checkout total.
                  return <span>৳{formatPrice(getBDTItemAmount(item), 2)}</span>;
                })()}
              </div>
            </div>
          ))}
          {couponCode && discountAmount > 0 && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-green-400">
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium">Discount</span>
              </div>
              <div className="text-sm font-semibold text-green-400">
                {isCryptoPayment ? (
                  <span>-${formatPrice(discountAmount / exchangeRate, 2)}</span>
                ) : (
                  <span>-৳{formatPrice(discountAmount, 2)}</span>
                )}
              </div>
            </div>
          )}
          <div className="border-t border-white/10 pt-4 flex items-center justify-between">
            <div className="text-lg font-semibold text-white">Total</div>
            <div className="text-2xl font-bold text-blue-400">
              {isCryptoPayment ? (
                getTotalPriceUSD ? (
                  <span>${formatPrice(getTotalPriceUSD(), 2)}</span>
                ) : (
                  <span className="text-red-400 text-sm">Price unavailable</span>
                )
              ) : (
                <span>৳{formatPrice(getTotalPrice(), 2)}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

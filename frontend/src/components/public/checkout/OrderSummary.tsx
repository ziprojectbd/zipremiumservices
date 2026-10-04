import React from "react";
import type { CartItem } from "../../../types";
import { useShopContext } from "../../../store/ShopContext";
import { Tag } from "lucide-react";
import { formatPrice } from "../../../utils/formatPrice";
import { priceWithAddons, selectedAddons } from "../../../utils/addons";

interface OrderSummaryProps {
  cart: CartItem[];
  getTotalPrice: () => number;
  getTotalPriceUSD?: () => number;
  paymentMethod?: string;
  exchangeRate?: number;
}

export default function OrderSummary({ cart, getTotalPrice, getTotalPriceUSD, paymentMethod, exchangeRate = 110 }: OrderSummaryProps) {
  const { showAlert, couponCode, discountAmount } = useShopContext();
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
          {cart.map((item, index) => {
            const basePrice = item.priceBDT || item.price;
            const addons = selectedAddons(item);
            const finalPrice = priceWithAddons(basePrice, item);

            return (
              <div key={`${item.id}-${index}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="text-sm text-gray-400">Qty: {item.quantity}</div>
                  </div>
                </div>
                <div className="pl-3 space-y-1">
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>Base Price</span>
                    <span>৳{formatPrice(basePrice, 0)}</span>
                  </div>
                  {addons.map((addon) => (
                    <div key={String(addon.key)} className="flex items-center justify-between text-sm text-purple-400">
                      <span>Kolotibablo Auto Login Service Fee +{addon.pricePercent}%</span>
                      <span>৳{formatPrice((basePrice * (addon.pricePercent || 0)) / 100, 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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
                  <span>-৳{formatPrice(discountAmount, 0)}</span>
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
                <span>৳{formatPrice(getTotalPrice(), 0)}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

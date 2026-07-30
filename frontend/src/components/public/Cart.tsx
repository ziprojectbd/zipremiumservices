import React, { useState, useEffect, useRef } from "react";
import { ShoppingCart, Plus, Minus, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";
import type { Product, CartItem } from "../../types";
import DynamicOrderForm, { validateOrderFields } from "./DynamicOrderForm";
import { formatPrice } from "../../utils/formatPrice";

function getSmmLinkPlaceholder(category: string, details?: string): string {
  const cat = (category || '').toLowerCase();
  const det = (details || '').toLowerCase();
  const typeMatch = det.match(/type:\s*(.+)/i);
  const type = typeMatch ? typeMatch[1].trim().toLowerCase() : '';
  const fullText = cat + ' ' + type;

  if (/free fire|pubg|mobile legends|imobile|mlbb/i.test(fullText)) {
    return 'Enter your player ID / username';
  }
  if (/clash of clans|coc|clash royale|cr/i.test(fullText)) {
    return 'Enter your player tag (e.g. #ABC123)';
  }
  if (/instagram/i.test(fullText)) {
    if (/comment|comments/i.test(fullText)) return 'Post URL (e.g. https://instagram.com/p/...)';
    if (/story|views/i.test(fullText)) return 'Story URL (e.g. https://instagram.com/stories/...)';
    if (/reel/i.test(fullText)) return 'Reel URL (e.g. https://instagram.com/reel/...)';
    return 'Profile / Post URL (e.g. https://instagram.com/username)';
  }
  if (/facebook|fb/i.test(fullText)) {
    if (/comment|comments/i.test(fullText)) return 'Post URL (e.g. https://facebook.com/username/posts/...)';
    if (/video|views/i.test(fullText)) return 'Video URL (e.g. https://facebook.com/watch?v=...)';
    return 'Profile / Post / Video URL';
  }
  if (/youtube|yt/i.test(fullText)) {
    if (/subscriber|subscribe/i.test(fullText)) return 'Channel URL (e.g. https://youtube.com/@channel)';
    return 'Video URL (e.g. https://youtube.com/watch?v=...)';
  }
  if (/tiktok/i.test(fullText)) {
    if (/comment|comments/i.test(fullText)) return 'Video URL (e.g. https://tiktok.com/@user/video/...)';
    return 'Profile / Video URL (e.g. https://tiktok.com/@username)';
  }
  if (/telegram/i.test(fullText)) {
    if (/member|join/i.test(fullText)) return 'Channel / Group invite link (e.g. https://t.me/...)';
    if (/post|view/i.test(fullText)) return 'Post URL (e.g. https://t.me/channel/123)';
    return 'Channel / Group URL (e.g. https://t.me/username)';
  }
  if (/twitter|x\.com/i.test(fullText)) {
    return 'Tweet / Profile URL (e.g. https://x.com/username/status/...)';
  }
  if (/threads/i.test(fullText)) return 'Thread / Profile URL (e.g. https://threads.net/@username)';
  if (/spotify/i.test(fullText)) return 'Track / Playlist URL';
  if (/soundcloud/i.test(fullText)) return 'Track URL (e.g. https://soundcloud.com/artist/track)';
  if (/website|traffic|web/i.test(fullText)) return 'Your website URL (e.g. https://yoursite.com)';
  if (/linkedin/i.test(fullText)) return 'Profile / Post URL (e.g. https://linkedin.com/in/username)';
  if (/discord/i.test(fullText)) return 'Server invite link (e.g. https://discord.gg/...)';
  if (/whatsapp|wa/i.test(fullText)) return 'Group invite link (e.g. https://chat.whatsapp.com/...)';
  if (/pinterest/i.test(fullText)) return 'Pin / Board URL (e.g. https://pinterest.com/pin/...)';
  if (/reddit/i.test(fullText)) return 'Post / Profile URL (e.g. https://reddit.com/r/subreddit/...)';
  if (/twitch/i.test(fullText)) return 'Channel URL (e.g. https://twitch.tv/username)';
  if (/snapchat/i.test(fullText)) return 'Username / Snapcode URL';
  if (/shopee/i.test(fullText)) return 'Shop / Product URL (e.g. https://shopee.com/...)';
  if (/lazada/i.test(fullText)) return 'Product URL (e.g. https://lazada.com/products/...)';
  if (/tidal/i.test(fullText)) return 'Track / Playlist URL';
  if (/vk/i.test(fullText)) return 'Post / Profile URL (e.g. https://vk.com/username)';
  if (/ok\.?ru/i.test(fullText)) return 'Post / Profile URL';
  if (/likee/i.test(fullText)) return 'Video / Profile URL';
  if (/kwai/i.test(fullText)) return 'Video / Profile URL';
  if (/imo/i.test(fullText)) return 'Username / Phone number';
  if (/lemon8/i.test(fullText)) return 'Profile / Post URL';
  if (/google/i.test(fullText)) return 'Review / Listing URL';

  return 'Target link / username';
}

export interface CartProps {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product) => void;
  updateCartItemLink: (productId: string | number, link: string) => void;
  updateCartItemCustomData: (productId: string | number, customData: Record<string, any>) => void;
  updateCartItemQuantity: (productId: string | number, quantity: number) => void;
  removeFromCart: (id: string | number) => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  getTotalPrice: () => number;
  setView: (
    view: "home" | "checkout" | "orders" | "order-history" | "order-details"
  ) => void;
  isLoggedIn: boolean;
  onSignInClick: () => void;
  onSignUpClick: () => void;
  onAlert: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, onConfirm?: () => void) => void;
}

export default function CartView({
  cart,
  isCartOpen,
  setIsCartOpen,
  addToCart,
  updateCartItemLink,
  updateCartItemCustomData,
  updateCartItemQuantity,
  removeFromCart,
  setCart,
  getTotalPrice,
  setView,
  isLoggedIn,
  onSignInClick,
  onSignUpClick,
  onAlert,
}: CartProps) {
  const navigate = useNavigate();
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  const [orderFormValues, setOrderFormValues] = useState<Record<string, Record<string, any>>>({});
  const [orderFormErrors, setOrderFormErrors] = useState<Record<string, Record<string, string>>>({});
  const [liveDetails, setLiveDetails] = useState<Record<string, any>>({});
  const [liveDetailsLoading, setLiveDetailsLoading] = useState<Record<string, boolean>>({});
  const initializedFormRef = useRef<Set<string>>(new Set());

  // Initialize Website Traffic order form values when orderFields become available
  useEffect(() => {
    for (const item of cart) {
      if (item.category !== 'Website Traffic' || item.smmServiceId === '8629') continue;
      const itemId = String(item.id);
      if (initializedFormRef.current.has(itemId)) continue;

      const fields = liveDetails[item.dbId || '']?.orderFields || item.orderFields;
      if (!fields?.length) continue;

      initializedFormRef.current.add(itemId);

      const initial: Record<string, any> = { ...(item.customData || {}) };
      for (const field of fields) {
        if (initial[field.key] !== undefined && initial[field.key] !== null) continue;
        if (field.defaultValue !== undefined && field.defaultValue !== null) {
          initial[field.key] = field.defaultValue;
        } else if (field.type === 'select' && field.options?.length === 1) {
          initial[field.key] = field.options[0];
        }
      }

      setOrderFormValues(prev => ({ ...prev, [itemId]: initial }));
      setOrderFormErrors(prev => ({ ...prev, [itemId]: {} }));
    }
  }, [cart, liveDetails]);

  // Fetch live product details from API for SMM items
  useEffect(() => {
    if (!isCartOpen) return;
    cart.forEach((item) => {
      if (item.smmProvider === 'oneservicebd' && item.dbId && !liveDetails[item.dbId]) {
        setLiveDetailsLoading(prev => ({ ...prev, [item.dbId]: true }));
        api.get(`/products/${item.dbId}`).then((res) => {
          const data = res.data?.data || res.data;
          if (data) {
            setLiveDetails(prev => ({ ...prev, [item.dbId]: data }));
          }
        }).catch(() => {
          // fallback: keep parsing static details
        }).finally(() => {
          setLiveDetailsLoading(prev => ({ ...prev, [item.dbId]: false }));
        });
      }
    });
  }, [isCartOpen, cart, liveDetails]);

  if (!isCartOpen) return null;

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => setIsCartOpen(false)}
      ></div>
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Order Cart
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 hide-scrollbar">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, index) => {
                  const isSmm = item.smmProvider === 'oneservicebd';
                  let smmMin = (isSmm && item.smmMin) ? item.smmMin : 1;
                  let smmMax = item.stock || 99999;
                  if (isSmm) {
                    if (item.smmMax) smmMax = Math.min(item.smmMax, item.stock || item.smmMax);
                    const text = [...item.features, item.details || ''].join(' ');
                    if (!item.smmMin) {
                      const minMatch = text.match(/Min(?:imum)?(?:\s+Order)?[:\s]*(\d+)/i);
                      if (minMatch) smmMin = parseInt(minMatch[1], 10);
                    }
                    if (!item.smmMax) {
                      const maxMatch = text.match(/Max(?:imum)?(?:\s+Order)?[:\s]*(\d+)/i);
                      if (maxMatch) smmMax = Math.min(parseInt(maxMatch[1], 10), item.stock || parseInt(maxMatch[1], 10));
                    }
                  }
                  const linkPlaceholder = isSmm ? getSmmLinkPlaceholder(item.category, item.details) : '';
                  return (
                  <div
                    key={`${item.id}-${index}`}
                    className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          ৳{formatPrice((item.priceBDT || item.price) * (isSmm ? item.quantity / 1000 : item.quantity), 2)}
                        </p>
                      </div>
                      {!isSmm ? (
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 shadow"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 shadow"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      ) : (
                      <button
                        onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                        className="text-red-400 hover:text-red-300 text-xs font-medium shrink-0"
                      >
                        Remove
                      </button>
                      )}
                    </div>
                    {isSmm && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Quantity <span className="text-gray-400">(min {smmMin} — max {smmMax.toLocaleString()})</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity - (item.quantity > 100 ? 100 : 1))}
                              disabled={item.quantity <= smmMin}
                              className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || smmMin;
                                updateCartItemQuantity(item.id, Math.min(smmMax, Math.max(smmMin, val)));
                              }}
                              className="w-full px-3 py-2 bg-white/5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white text-center font-bold focus:outline-none focus:border-blue-500"
                              min={smmMin}
                              max={smmMax}
                            />
                            <button
                              type="button"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity + (item.quantity >= 100 ? 100 : 1))}
                              disabled={item.quantity >= smmMax}
                              className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {(() => {
                          const productData = liveDetails[item.dbId || ''];
                          const isLoading = liveDetailsLoading[item.dbId || ''];
                          const src = productData?.details || item.details || '';
                          if (!src.trim()) return null;
                          const lines = src.split('\n').filter((l: string) => l.trim());
                          const hasDetails = lines.length > 0;
                          return hasDetails ? (
                            <div className="bg-blue-50/60 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30 overflow-hidden">
                              <div className="px-3 py-2 bg-blue-100/50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                                    Service Details
                                    {isLoading && <Loader2 className="w-3 h-3 inline ml-1 animate-spin text-blue-400" />}
                                    {!isLoading && productData && <CheckCircle2 className="w-3 h-3 inline ml-1 text-green-500" />}
                                  </span>
                                </div>
                              </div>
                              <div className="p-2.5 whitespace-pre-wrap text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
                                {src}
                              </div>
                            </div>
                          ) : null;
                        })()}
                        {(() => {
                          const isWebsiteTraffic = item.category === 'Website Traffic' && item.smmServiceId !== '8629';
                          const productData = liveDetails[item.dbId || ''];
                          const fields = productData?.orderFields || item.orderFields;
                          const hasOrderFields = isWebsiteTraffic && fields?.length > 0;

                          if (hasOrderFields) {
                            return (
                              <div className="pt-2">
                                <DynamicOrderForm
                                  fields={fields}
                                  values={orderFormValues[item.id] || {}}
                                  onChange={(key, value) => {
                                    const newValues = { ...(orderFormValues[item.id] || {}), [key]: value };
                                    setOrderFormValues(prev => ({ ...prev, [item.id]: newValues }));
                                    updateCartItemCustomData(item.id, newValues);
                                  }}
                                  errors={orderFormErrors[item.id] || {}}
                                />
                              </div>
                            );
                          }

                          return (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Target Link / Username <span className="text-red-400">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <ExternalLink className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400" />
                              <input
                                type="url"
                                value={linkInputs[item.id] ?? item.link ?? ''}
                                onChange={(e) => {
                                  setLinkInputs(prev => ({ ...prev, [item.id]: e.target.value }));
                                  updateCartItemLink(item.id, e.target.value);
                                }}
                                placeholder={linkPlaceholder}
                                className="w-full pl-8 pr-3 py-2 bg-white/5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            {item.link ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            ) : (
                              <span className="text-[10px] text-red-400 font-medium shrink-0">Required</span>
                            )}
                          </div>
                        </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total:
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  ৳{formatPrice(getTotalPrice(), 2)}
                </span>
              </div>
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    onAlert("warning", "Sign In Required", "Please sign in to proceed to checkout and complete your order.", onSignInClick);
                    setIsCartOpen(false);
                    return;
                  }
                  // Check SMM items — URL/fields required for oneservicebd products
                  for (const item of cart) {
                    if (item.smmProvider !== 'oneservicebd') continue;

                    // For Website Traffic items with order fields, validate the customData
                    if (item.category === 'Website Traffic' && item.smmServiceId !== '8629') {
                      const productData = liveDetails[item.dbId || ''];
                      const fields = productData?.orderFields || item.orderFields;
                      if (fields?.length > 0) {
                        const errors = validateOrderFields(fields, orderFormValues[item.id] || {});
                        if (Object.keys(errors).length > 0) {
                          const firstError = Object.values(errors)[0];
                          onAlert("warning", "Please Complete All Fields", `${firstError} for "${item.name}".`);
                          return;
                        } else {
                          // Sync validated data to customData
                          updateCartItemCustomData(item.id, orderFormValues[item.id] || {});
                        }
                        continue; // Skip the link check for this item
                      }
                    }

                    if (!item.link?.trim()) {
                      onAlert("warning", "Link Required", `Please provide a target link/username for "${item.name}" before proceeding to checkout.`);
                      return;
                    }
                  }
                  setIsCartOpen(false);
                  navigate("/payment-and-confirmation");
                }}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

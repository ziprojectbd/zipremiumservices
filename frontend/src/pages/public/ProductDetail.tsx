import { devLog } from '../../utils/devLogger';

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft, ShoppingCart, CheckCircle2, Sparkles, Shield, Zap, Globe, XCircle, ChevronLeft, ChevronRight, Clock, Tag,
} from "lucide-react";
import { useShopContext } from "../../store/ShopContext";
import ProductReviews from "../../components/public/ProductReviews";
import type { Product } from "../../types";
import CampaignBadge from "../../components/public/campaign/CampaignBadge";
import CountdownTimer from "../../components/public/campaign/CountdownTimer";
import api from "../../lib/axios";
import { formatPrice } from "../../utils/formatPrice";

export default function ProductDetail() {
  const { slug, '*': wildcard } = useParams<{ slug: string; '*': string }>();
  const rawId = wildcard || slug || '';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, lastAddedProductId, showAlert, cart, getTotalItems, isLoggedIn, theme, toggleTheme, username, userEmail, userImage, setIsCartOpen } = useShopContext();
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [productImages, setProductImages] = React.useState<string[]>([]);
  const [showDetails, setShowDetails] = React.useState(false);

  React.useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await api.get(`/products/${rawId}`);
        const json = res.data;
        if (json.success && json.data) {
          const p = json.data;
          const descLines = (p.description || "")
            .split("\n")
            .map((l: string) => l.trim())
            .filter((l: string) => l.length > 0);
          setProduct({
            id: p._id || rawId,
            dbId: p._id,
            name: p.name,
            description: descLines.length > 1 ? descLines[0] : (p.description || ""),
            price: p.priceBDT || p.price,
            originalPrice: p.originalPrice || p.price,
            category: p.category,
            features: descLines,
            imageUrl: p.imageUrl,
            images: p.images,
            stock: p.stock,
            details: p.details,
            available: Boolean(p.available),
            showStock: Boolean(p.showStock),
            showImageSlider: p.showImageSlider !== false,
            smmProvider: p.smmProvider || '',
            smmServiceId: p.smmServiceId || '',
            smmMin: p.smmMin || undefined,
            smmMax: p.smmMax || undefined,
            orderFields: p.orderFields || [],
            seoSlug: p.seoSlug || '',
            // Campaign fields from API
            campaignPrice: p.campaignPrice,
            campaignDiscount: p.campaignDiscount,
            campaignAmountSaved: p.campaignAmountSaved,
            campaignBadge: p.campaignBadge,
            campaignSlug: p.campaignSlug,
            campaignColor: p.campaignColor,
            campaignDiscountType: p.campaignDiscountType,
            campaignEndDate: p.campaignEndDate,
          });
          const imgs: string[] = [];
          if (p.images && Array.isArray(p.images) && p.images.length > 0) {
            imgs.push(...p.images.filter((i: string) => i));
          }
          if (p.imageUrl && !imgs.includes(p.imageUrl)) {
            imgs.unshift(p.imageUrl);
          }
          setProductImages(imgs);
      } else {
          setNotFound(true);
        }
      } catch (e) {
        devLog("Failed to fetch product:", e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    if (rawId) fetchProduct();
  }, [rawId]);

  // Auto-slide images every 4 seconds (only when enabled)
  React.useEffect(() => {
    if (productImages.length <= 1) return;
    if (product?.showImageSlider === false) return;
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % productImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [productImages.length, product?.showImageSlider]);

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" /></div>;
  }

  if (!product || notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Product Not Found</h1>
          <p className="text-gray-400 mb-6">The product you are looking for does not exist.</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all">Go Home</button>
        </div>
      </div>
    );
  }

  const hashId = product.dbId || product.id;
  const hash = typeof hashId === "string" ? hashId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) : Number(hashId);
  const hue = (hash * 47) % 360;
  const accentFrom = `hsl(${hue}, 55%, 30%)`;
  const accentTo = `hsl(${(hue + 40) % 360}, 55%, 30%)`;
  const isAdded = lastAddedProductId === product.id;
  const inCart = cart.some((item) => item.id === product.id);
  const hasImage = productImages.length > 0;

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      </div>
      <div className="relative z-10 p-4 sm:p-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /><span className="text-sm font-medium">Back to Shop</span></button>
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col lg:flex-row">
          <div className="lg:w-5/12 p-8 sm:p-10 lg:p-14 flex flex-col justify-between relative">
            <div className="absolute inset-0"><div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }} /></div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold mb-6"><Sparkles className="w-4 h-4" /><span>{product.category}</span></div>
              <div className="flex items-center justify-center mb-8">
                {hasImage && !imgError ? (
                  <div className="relative w-full aspect-[16/9] rounded-2xl border-2 border-white/10 shadow-2xl bg-black/20 overflow-hidden group">
                    <img
                      src={productImages[currentImageIndex] || ''}
                      alt={product.name}
                      className="object-cover w-full h-full transition-opacity duration-300"
                      onError={() => setImgError(true)}
                    />
                    {/* Slider arrows */}
                    {productImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(prev => (prev - 1 + productImages.length) % productImages.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(prev => (prev + 1) % productImages.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {/* Dots indicator */}
                    {productImages.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                        {productImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/50 hover:bg-white/80'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl"><span className="text-5xl sm:text-6xl font-bold text-white/60">{product.name.charAt(0).toUpperCase()}</span></div>}
              </div>
              {product.available === false && <div className="flex items-center gap-3 justify-center mt-2"><span className="px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold">Unavailable</span></div>}
            </div>
            <div className="relative z-10 mt-8 flex items-center gap-4 text-sm text-white/60"><div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-400" /><span>Verified</span></div><div className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-yellow-400" /><span>Instant</span></div><div className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-blue-400" /><span>Global</span></div></div>
          </div>
          <div className="relative w-full lg:w-7/12 bg-gray-900/50 backdrop-blur-3xl p-6 sm:p-8 lg:p-10 xl:p-12 overflow-y-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight"><span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(90deg, hsl(${hue}, 70%, 65%), hsl(${(hue + 60) % 360}, 80%, 65%), hsl(${(hue + 120) % 360}, 70%, 65%))` }}>{product.name}</span></h1>
            {product.description && <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">{product.description}</p>}
            {/* Toggle button for details */}
            {(product.features.length > 0 || product.details) && (
              <button
                onClick={() => setShowDetails(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 mb-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all duration-300 text-sm font-medium"
              >
                <span>{showDetails ? 'Hide' : 'Show'} Details</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            <div className={`overflow-y-auto transition-all duration-500 ease-in-out ${
              showDetails ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'
            }`} style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            {showDetails && (
            <>
            {product.features.length > 0 && <div className="mb-6"><h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">What You Get</h3><div className="grid grid-cols-2 gap-2">{product.features.map((feature, index) => <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5"><div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `hsl(${(hue + index * 50) % 360}, 60%, 55%)` }}><CheckCircle2 className="w-3 h-3 text-white" /></div><span className="text-sm text-gray-300">{feature}</span></div>)}</div></div>}
            {product.details && (() => {
              const lines = product.details.split('\n').filter((l: string) => l.trim());
              const apiFields = lines.map((line: string) => {
                const colonIdx = line.indexOf(':');
                if (colonIdx === -1) return null;
                return { label: line.substring(0, colonIdx).trim(), value: line.substring(colonIdx + 1).trim() };
              }).filter(Boolean);
              // Only show Service Details table if most lines have colons (structured key:value data)
              const isStructuredData = apiFields.length > 3;
              return isStructuredData ? (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Service Details</h3>
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: `hsla(${hue}, 50%, 55%, 0.15)` }}>
                    <div className="px-4 py-2.5" style={{ background: `hsla(${hue}, 50%, 55%, 0.08)` }}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: `hsl(${hue}, 60%, 55%)` }}></span>
                        <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Service Details</span>
                      </div>
                    </div>
                    <div className="p-3" style={{ background: `hsla(${hue}, 50%, 55%, 0.03)` }}>
                      {apiFields.map((field: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0" style={{ borderColor: `hsla(${hue}, 50%, 55%, 0.08)` }}>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{field.label}</span>
                          <span className="text-xs sm:text-sm text-gray-200 font-semibold">{field.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6"><h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Details</h3><div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5"><p className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{product.details}</p></div></div>
              );
            })()}
            </>
            )}
            </div>
            <div className="p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm mb-6" style={{ borderColor: `hsla(${hue}, 50%, 55%, 0.15)`, background: `linear-gradient(135deg, hsla(${hue}, 50%, 55%, 0.04), hsla(${(hue + 80) % 360}, 50%, 55%, 0.04))` }}>
              <div className="flex items-center justify-between">
                <div>
                  {product.campaignBadge && (
                    <div className="flex items-center gap-2 mb-2">
                      <CampaignBadge
                        name={product.campaignBadge}
                        slug={product.campaignSlug || ""}
                        color={product.campaignColor || "#ef4444"}
                        discountPercent={product.campaignDiscount}
                        amountSaved={product.campaignAmountSaved}
                      />
                      {product.campaignEndDate && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                          <Clock className="w-3 h-3 text-red-400" />
                          <CountdownTimer endDate={product.campaignEndDate} colorTheme="#ef4444" compact />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-baseline gap-3">
                    {product.campaignPrice && product.campaignPrice < product.price ? (
                      <>
                        <span className="text-3xl font-bold" style={{ color: product.campaignColor || "#ef4444" }}>
                          ৳{formatPrice(product.campaignPrice, 2)}
                        </span>
                        <span className="text-xl text-gray-500 line-through">৳{formatPrice(product.price, 2)}</span>
                        {product.campaignDiscount && product.campaignDiscount > 0 && (
                          <span className="text-sm font-bold px-2 py-0.5 rounded" style={{ background: `${product.campaignColor || '#ef4444'}22`, color: product.campaignColor || '#ef4444' }}>
                            -{Math.round(product.campaignDiscount)}%
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-3xl font-bold" style={{ backgroundImage: `linear-gradient(90deg, hsl(${hue}, 70%, 65%), hsl(${(hue + 60) % 360}, 80%, 65%))`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        ৳{formatPrice(product.price, 2)}
                      </span>
                    )}
                  </div>
                  {product.campaignAmountSaved && product.campaignAmountSaved > 0 && (
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      You save ৳{formatPrice(product.campaignAmountSaved, 0)} on this deal!
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3"><button onClick={handleAddToCart} disabled={isAdded || inCart || product.available === false} className={`w-full relative group overflow-hidden font-bold py-4 sm:py-4.5 rounded-xl transition-all shadow-lg text-sm sm:text-base flex items-center justify-center gap-3 ${inCart ? "bg-green-600/30 border border-green-500/30 text-green-400 cursor-default" : product.available === false ? "bg-gray-600/30 border border-gray-500/30 text-gray-400 cursor-not-allowed" : "hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"}`} style={!inCart && product.available !== false ? { background: `linear-gradient(135deg, hsl(${hue}, 60%, 45%), hsl(${(hue + 60) % 360}, 70%, 45%))`, boxShadow: `0 4px 20px hsla(${hue}, 70%, 50%, 0.25)` } : {}}><div className="relative z-10 flex items-center justify-center gap-3">{inCart ? <><CheckCircle2 className="w-5 h-5" /><span>Already in Cart</span></> : isAdded ? <><CheckCircle2 className="w-5 h-5" /><span>Added! View Cart</span></> : product.available === false ? <><XCircle className="w-5 h-5" /><span>Unavailable</span></> : <><ShoppingCart className="w-5 h-5" /><span>Add to Cart</span></>}</div></button></div>
          </div>
        </div>
        {product.smmProvider === 'oneservicebd' && (
          <div className="mt-8 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 rounded-2xl" style={{ background: `linear-gradient(135deg, hsla(${hue}, 60%, 50%, 0.08), hsla(${(hue + 60) % 360}, 60%, 50%, 0.04))` }} />
            <div className="absolute inset-0 rounded-2xl border" style={{ borderColor: `hsla(${hue}, 60%, 55%, 0.15)` }} />
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl" style={{ background: `hsla(${hue}, 60%, 55%, 0.06)` }} />

            <div className="relative p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl" style={{ background: `hsla(${hue}, 60%, 55%, 0.12)`, boxShadow: `0 0 20px hsla(${hue}, 60%, 55%, 0.08)` }}>
                  <svg className="w-5 h-5" style={{ color: `hsl(${hue}, 65%, 65%)` }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Refund Policy</span>
                  </h3>
                  <p className="text-xs" style={{ color: `hsla(${hue}, 50%, 70%, 0.6)` }}>Please read carefully before placing any order</p>
                </div>
              </div>

              {/* Items */}
              <div className="grid gap-3">
                {[
                  { title: 'Completed Orders', text: 'Completed orders cannot be refunded.', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { title: 'Partial Refund', text: 'If an order cannot be completed or is canceled by the system, the remaining balance may be refunded to your account balance.', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                  { title: 'Wrong Orders', text: 'We are not responsible for orders placed with incorrect links, usernames, or information.', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { title: 'Chargebacks', text: 'Any chargeback or payment dispute may result in account suspension.', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { title: 'Support', text: 'For refund-related issues, please contact our support team.', icon: 'M18.364 5.636a9 9 0 11-12.728 0M12 2v4m0 0l-2-2m2 2l2-2' },
                ].map((item, i) => (
                  <div key={i} className="group relative flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-300 cursor-default" style={{ borderLeft: `2px solid hsla(${hue}, 60%, 55%, ${0.1 + i * 0.04})` }}>
                    <div className="p-1.5 rounded-lg shrink-0 transition-all duration-300 group-hover:scale-110" style={{ background: `hsla(${hue}, 60%, 55%, 0.1)`, color: `hsl(${hue}, 60%, 65%)` }}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors mb-0.5">{item.title}</h4>
                      <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <ProductReviews productId={hashId as string} accentHue={hue} isLoggedIn={isLoggedIn} username={username} userEmail={userEmail} userImage={userImage} onSignInClick={() => navigate("/sign-in")} />
      </div>
    </div>
  );
}

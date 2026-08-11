import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ShoppingCart,
  Shield,
  Zap,
  Clock,
  Gift,
  Sparkles,
  CheckCircle2,
  Tag,
  Percent,
  Flame,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

import { useShopContext } from "../../store/ShopContext";
import type { Product, CampaignData } from "../../types";
import api from "../../lib/axios";
import CampaignBannerSlider from "../../components/public/campaign/CampaignBannerSlider";
import CampaignBadge from "../../components/public/campaign/CampaignBadge";
import CountdownTimer from "../../components/public/campaign/CountdownTimer";
import { useActiveCampaigns } from "../../components/public/campaign/useActiveCampaigns";
import { formatPrice } from "../../utils/formatPrice";

// ─── Campaign Product Card ──────────────────────────────────────────────
function CampaignProductCard({
  product,
  addToCart,
  lastAddedProductId,
  setIsCartOpen,
  campaignColor = "#ef4444",
}: {
  product: Product;
  addToCart: (product: Product) => void;
  lastAddedProductId: string | number | null;
  setIsCartOpen: (open: boolean) => void;
  campaignColor?: string;
}) {
  const navigate = useNavigate();
  const inCart = lastAddedProductId === product.id;
  const idNum = typeof product.id === 'number' ? product.id : parseInt(String(product.id).replace(/\D/g, '').substring(0, 8) || '0', 10);
  const hue = (idNum * 47) % 360;

  return (
    <div
      className="group relative rounded-2xl overflow-hidden backdrop-blur-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
      style={{ borderColor: inCart ? `${campaignColor}44` : undefined }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 w-full h-[3px] z-20"
        style={{ background: `linear-gradient(90deg, ${campaignColor}, ${campaignColor}88, ${campaignColor})` }}
      />

      {/* Image */}
      <div className="relative w-full h-[180px] overflow-hidden bg-gradient-to-br" style={{ background: `linear-gradient(135deg, hsl(${hue}, 55%, 30%), hsl(${(hue + 40) % 360}, 55%, 30%))` }}>
        {product.images?.[0] || product.imageUrl ? (
          <img
            src={product.images?.[0] || product.imageUrl!}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-white/40">{product.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Campaign Badge */}
        {product.campaignBadge && (
          <div className="absolute top-3 left-3">
            <CampaignBadge
              name={product.campaignBadge}
              slug={product.campaignSlug || ""}
              color={campaignColor}
              discountPercent={product.campaignDiscount}
              amountSaved={product.campaignAmountSaved}
              compact
            />
          </div>
        )}
        {product.campaignEndDate && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
            <Clock className="w-3 h-3 text-red-400" />
            <CountdownTimer endDate={product.campaignEndDate} colorTheme="#ef4444" compact />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold text-white mb-3 line-clamp-1">{product.name}</h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          {product.campaignPrice && product.campaignPrice < product.price ? (
            <>
              <span className="text-xl font-extrabold" style={{ color: campaignColor }}>
                ৳{formatPrice(product.campaignPrice, 2)}
              </span>
              <span className="text-sm text-gray-500 line-through">৳{formatPrice(product.price, 2)}</span>
              {product.campaignDiscount && product.campaignDiscount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${campaignColor}22`, color: campaignColor }}>
                  -{Math.round(product.campaignDiscount)}%
                </span>
              )}
            </>
          ) : (
            <span className="text-xl font-extrabold text-white">৳{formatPrice(product.price, 2)}</span>
          )}
        </div>

        {/* Features */}
        <div className="space-y-1 mb-4">
          {product.features.slice(0, 2).map((feature, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span className="text-xs text-gray-400 line-clamp-1">{feature}</span>
            </div>
          ))}
        </div>

        {/* Add to Cart */}
        <button
          onClick={() => addToCart(product)}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${campaignColor}, ${campaignColor}bb)`,
            color: "#fff",
          }}
        >
          <ShoppingCart className="w-4 h-4" />
          {inCart ? "View Cart" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

// ─── Featured Campaign Hero ──────────────────────────────────────────────
function CampaignHero({ campaign }: { campaign: CampaignData }) {
  const navigate = useNavigate();
  const color = campaign.colorTheme || "#ef4444";
  const endTime = campaign.endDate;

  return (
    <div
      className="relative rounded-3xl overflow-hidden border cursor-pointer group"
      style={{ borderColor: `${color}44` }}
      onClick={() => navigate(`/special-offer?campaign=${campaign.slug}`)}
    >
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}22, ${color}44, ${color}22)` }} />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 50%, ${color} 0%, transparent 60%), radial-gradient(circle at 70% 50%, ${color} 0%, transparent 60%)`,
        }}
      />
      <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: `${color}22`, color }}>
            <Flame className="w-4 h-4" /> ACTIVE CAMPAIGN
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">{campaign.name}</h2>
          {campaign.description && (
            <p className="text-white/70 mb-4 max-w-xl">{campaign.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            {campaign.discountType === "percentage" && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
                <Percent className="w-5 h-5" style={{ color }} />
                <span className="text-white font-bold">{campaign.discountValue}% OFF</span>
              </div>
            )}
            {endTime && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
                <Clock className="w-4 h-4 text-red-400" />
                <CountdownTimer endDate={endTime} colorTheme={color} compact />
              </div>
            )}
            <button
              className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: "#fff" }}
            >
              Shop Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </div>
        {campaign.campaignLogo && (
          <div className="flex-shrink-0">
            <img
              src={campaign.campaignLogo}
              alt={campaign.name}
              className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────
function SpecialOfferContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignFilter = searchParams.get("campaign");

  const {
    addToCart, getTotalItems,
    setIsCartOpen,
    menuOpen, setMenuOpen,
    theme, toggleTheme,
    username,
    isLoggedIn,
    userEmail,
    userImage,
    showAlert,
    lastAddedProductId,
  } = useShopContext();
  const { campaigns, banners, loading: campaignsLoading } = useActiveCampaigns();

  // Helper to map API product to Product type
  const mapApiProduct = (p: any): Product => ({
    id: p._id,
    dbId: p._id,
    name: p.name,
    description: (p.description || "").split("\n").filter((l: string) => l.trim())[0] || "",
    price: p.priceBDT || p.priceUSDT || p.price || 0,
    originalPrice: p.price || 0,
    category: p.category,
    features: (p.description || "").split("\n").filter((l: string) => l.trim()),
    imageUrl: p.imageUrl,
    images: p.images,
    stock: p.stock,
    available: Boolean(p.available),
    showStock: Boolean(p.showStock),
    seoSlug: p.seoSlug || "",
    details: p.details,
  });

  // Fetch campaign products when campaigns change
  const [campaignProducts, setCampaignProducts] = useState<Record<string, Product[]>>({});
  const [campaignProductsLoading, setCampaignProductsLoading] = useState(false);

  useEffect(() => {
    if (!campaigns.length) return;
    let cancelled = false;
    setCampaignProductsLoading(true);

    async function fetchCampaignProducts() {
      const results: Record<string, Product[]> = {};
      for (const c of campaigns) {
        try {
          const res = await api.get(`/campaigns/${c.slug}?limit=12`);
          const json = res.data;
          if (!cancelled && json.success && json.data?.products) {
            results[c.slug] = (json.data.products || []).map((p: any) => ({
              ...mapApiProduct(p),
              campaignPrice: p.campaignPrice,
              campaignDiscount: p.campaignDiscount,
              campaignAmountSaved: p.campaignAmountSaved,
              campaignBadge: p.campaignBadge,
              campaignSlug: p.campaignSlug,
              campaignColor: p.campaignColor,
              campaignDiscountType: p.campaignDiscountType,
              campaignEndDate: json.data.campaign?.endDate || c.endDate,
            }));
          }
        } catch { /* skip */ }
      }
      if (!cancelled) {
        setCampaignProducts(results);
        setCampaignProductsLoading(false);
      }
    }

    fetchCampaignProducts();
    return () => { cancelled = true; };
  }, [campaigns]);

  // Determine which campaign to highlight
  const featuredCampaign = useMemo(
    () => campaigns.find(c => c.isFeatured) || campaigns[0],
    [campaigns]
  );

  const loading = campaignsLoading || campaignProductsLoading || (campaigns.length > 0 && Object.keys(campaignProducts).length === 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-8 sm:py-10 md:py-14">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-pink-900/40" />

        {/* Animated particles — hidden on mobile to prevent overflow */}
        <div className="absolute inset-0 overflow-hidden hidden sm:block">
          <div className="absolute top-10 left-1/4 w-32 sm:w-48 h-32 sm:h-48 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-36 sm:w-56 h-36 sm:h-56 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-2 sm:mb-3">
            <div className="relative">
              <Gift className="w-10 h-10 sm:w-14 sm:h-14 text-yellow-300 animate-pulse" />
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 animate-spin" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2 sm:mb-3">
            <span className="bg-gradient-to-r from-yellow-200 via-orange-200 to-pink-200 bg-clip-text text-transparent drop-shadow-lg">
              Special Offers
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/80 mb-4 sm:mb-5 max-w-2xl mx-auto px-2">
            {campaignFilter
              ? `Check out deals from ${campaigns.find(c => c.slug === campaignFilter)?.name || "this campaign"}!`
              : "Premium services at unbeatable prices — limited time deals!"}
          </p>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 px-2">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-300" />
              <span className="text-white text-xs sm:text-sm font-semibold whitespace-nowrap">100% Genuine</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300" />
              <span className="text-white text-xs sm:text-sm font-semibold whitespace-nowrap">Instant Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-300" />
              <span className="text-white text-xs sm:text-sm font-semibold whitespace-nowrap">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Banners */}
      {banners.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 mb-8">
          <CampaignBannerSlider banners={banners} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading Spinner (only initial load) */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* No Campaigns — subtle note, not blocking */}
        {!campaignsLoading && campaigns.length === 0 && (
          <div className="text-center py-10 mb-8">
            <h2 className="text-xl font-bold text-white/50 mb-1">No Active Campaigns Right Now</h2>
            <p className="text-white/30 text-sm">Browse all our services below!</p>
          </div>
        )}

        {/* Featured Campaign Hero */}
        {!campaignsLoading && featuredCampaign && !campaignFilter && (
          <div className="mb-12">
            <CampaignHero campaign={featuredCampaign} />
          </div>
        )}

        {/* Campaign Sections */}
        {!campaignsLoading && campaigns.map((campaign) => {
          const products = campaignProducts[campaign.slug];
          if (campaignFilter && campaign.slug !== campaignFilter) return null;
          if (!products || products.length === 0) {
            if (campaignFilter && campaignProductsLoading) {
              return (
                <section key={campaign._id} className="mb-16">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="rounded-2xl bg-white/5 animate-pulse h-[320px]" />
                    ))}
                  </div>
                </section>
              );
            }
            return null;
          }

          const color = campaign.colorTheme || "#ef4444";

          return (
            <section key={campaign._id} className="mb-16">
              {/* Campaign Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
                    <Tag className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">{campaign.name}</h2>
                    {campaign.description && (
                      <p className="text-sm text-white/50">{campaign.description}</p>
                    )}
                  </div>
                  {campaign.endDate && (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 ml-4">
                      <Clock className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-xs text-white/70">Ends:</span>
                      <CountdownTimer endDate={campaign.endDate} colorTheme={color} compact />
                    </div>
                  )}
                </div>
                {!campaignFilter && (
                  <button
                    onClick={() => navigate(`/special-offer?campaign=${campaign.slug}`)}
                    className="flex items-center gap-1 text-sm font-semibold transition-colors hover:underline"
                    style={{ color }}
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Countdown for mobile */}
              {campaign.endDate && (
                <div className="sm:hidden flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-black/30 border border-white/10">
                  <Clock className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-white/70">Offer ends in:</span>
                  <CountdownTimer endDate={campaign.endDate} colorTheme={color} compact />
                </div>
              )}

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <CampaignProductCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                    lastAddedProductId={lastAddedProductId}
                    setIsCartOpen={setIsCartOpen}
                    campaignColor={color}
                  />
                ))}
              </div>

              {campaignProductsLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-2xl bg-white/5 animate-pulse h-[320px]" />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* CTA Section */}
      <div className="border-t border-white/10 py-12 sm:py-16 bg-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Get Started Today!</h2>
          <p className="text-sm sm:text-lg text-white/60 mb-6 sm:mb-8">
            Browse our premium services and find what you need!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <button
              onClick={() => navigate("/")}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg text-sm sm:text-base"
            >
              Explore All Services
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20 text-sm sm:text-base"
            >
              View Cart ({getTotalItems()})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap with Suspense boundary for useSearchParams
export default function SpecialOfferPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    }>
      <SpecialOfferContent />
    </Suspense>
  );
}

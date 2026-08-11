import React, { useState, useEffect } from "react";
import { ShoppingCart, CheckCircle2, AlertCircle, Key, Eye, EyeOff, Copy, Package } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useShopContext } from "../../store/ShopContext";
import api from "../../lib/axios";
import { formatPrice } from "../../utils/formatPrice";

interface CaptchaPlan {
  id: string;
  type: string;
  code: string;
  price: string;
  priceValue: number;
  validity: string;
  recognition: string;
  isPromo: boolean;
  count?: number;
  dailyLimit?: number;
  rateLimit?: number;
}

const typeLabels: Record<string, string> = {
  count: "Captcha Pack",
  daily: "Daily Plan",
  minute: "Rate Plan",
};

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse min-h-[380px] sm:min-h-[420px]"
        >
          <div className="h-[200px] rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer" />
          <div className="mt-4 h-5 w-2/3 rounded bg-white/10" />
          <div className="mt-2 h-4 w-1/2 rounded bg-white/10" />
          <div className="mt-6 space-y-2">
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-3/4 rounded bg-white/10" />
          </div>
          <div className="mt-6 h-10 w-full rounded-xl bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{message}</p>
    </div>
  );
}

interface ActivePackage {
  id: string;
  planName: string;
  credits: number;
  creditsUsed: number;
  creditsRemaining: number;
  captchaApiKey: string | null;
  status: string;
}

export default function CaptchaSolvesApiCards({
  lastAddedProductId,
  addToCart,
}: {
  lastAddedProductId: string | number | null;
  addToCart: (product: any) => void;
}) {
  const { exchangeRate } = useShopContext();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<CaptchaPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pricingTab, setPricingTab] = useState<"all" | "daily" | "count">("all");

  const filteredPlans = plans.filter((plan) => {
    if (pricingTab === "all") return true;
    return plan.type === pricingTab;
  });
  const [activePackages, setActivePackages] = useState<ActivePackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [captchaDiscount, setCaptchaDiscount] = useState<{ discountPercent: number; discountEnabled: boolean; exchangeRate: number }>({ discountPercent: 20, discountEnabled: true, exchangeRate: 0 });

  useEffect(() => {
    fetch("https://captchamaster.org/api/pricing")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setPlans(data.data);
        } else {
          setError("Failed to load pricing data");
        }
      })
      .catch(() => setError("Failed to connect to pricing service"))
      .finally(() => setLoading(false));

    // Fetch captcha discount settings
    api.get("/captcha-settings")
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setCaptchaDiscount(res.data.data);
        }
      })
      .catch(() => {});

    // Fetch logged-in user's active captcha packages
    if (isAuthenticated) {
      setPackagesLoading(true);
      api.get("/customer/captchamaster/packages?limit=50")
        .then((res) => res.data)
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setActivePackages(data.data);
          }
        })
        .catch(() => {})
        .finally(() => setPackagesLoading(false));
    }
  }, [isAuthenticated]);

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyKey = async (key: string, id: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  if (loading) return <SkeletonGrid />;

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-8 h-8 text-red-400" />}
        title="Unable to Load Plans"
        message={error}
      />
    );
  }

  if (plans.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="w-8 h-8 text-gray-500" />}
        title="No Plans Available"
        message="Check back later for updated pricing."
      />
    );
  }

  return (
    <>

    {/* Active API Keys Section - logged in user's purchased packages */}
    {isAuthenticated && packagesLoading && (
      <div className="mt-0 mb-8 p-6 text-center text-gray-500 text-sm">
        Loading your packages...
      </div>
    )}
    {isAuthenticated && !packagesLoading && activePackages.length === 0 && (
      <div className="mt-0 mb-8 p-8 bg-white/[0.03] rounded-xl border border-white/10 text-center">
        <Key className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">No Active API Keys</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          You haven't purchased any captcha packages yet. Buy a plan above to get your API key.
        </p>
      </div>
    )}
    {isAuthenticated && !packagesLoading && activePackages.length > 0 && (
      <div className="mt-0 mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Key className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Your Active API Keys
          </h2>
          <span className="px-2.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
            {activePackages.length} package{activePackages.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid gap-4">
          {activePackages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10 p-5 hover:border-yellow-400/30 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <Package className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-base font-bold text-white">{pkg.planName}</h3>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400">
                      {pkg.status}
                    </span>
                  </div>

                  {/* Credits info */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-400 mb-3">
                    <span>Credits: {pkg.creditsRemaining.toLocaleString()} / {pkg.credits.toLocaleString()}</span>
                    {pkg.credits > 0 && (
                      <span>{Math.round((pkg.creditsUsed / pkg.credits) * 100)}% used</span>
                    )}
                  </div>

                  {/* API Key display */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-black/30 rounded-lg px-3 py-2.5 border border-white/5 w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Key className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <code className="text-xs sm:text-sm font-mono text-gray-200 break-all select-all">
                        {visibleKeys.has(pkg.id)
                          ? pkg.captchaApiKey
                          : pkg.captchaApiKey
                            ? `${pkg.captchaApiKey.slice(0, 12)}${".".repeat(20)}`
                            : "No key"}
                      </code>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => toggleKeyVisibility(pkg.id)}
                        className="p-1.5 text-gray-500 hover:text-gray-200 transition-colors rounded-lg hover:bg-white/5"
                        title={visibleKeys.has(pkg.id) ? "Hide API Key" : "Show API Key"}
                      >
                        {visibleKeys.has(pkg.id) ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {pkg.captchaApiKey && (
                        <button
                          onClick={() => handleCopyKey(pkg.captchaApiKey!, pkg.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-200 transition-colors rounded-lg hover:bg-white/5"
                          title="Copy API Key"
                        >
                          {copiedKey === pkg.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Login prompt when not logged in */}
    {!isAuthenticated && !authLoading && (
      <div className="mt-0 mb-8 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20 text-center">
        <p className="text-gray-400 text-sm">
          <a href="/sign-in" className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2">
            Sign in
          </a> to view your purchased API keys and manage your packages.
        </p>
      </div>
    )}

    {/* Pricing Heading & Tabs */}
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-2xl sm:text-3xl font-bold text-white">Pricing</h2>
      <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
        {filteredPlans.length} package{filteredPlans.length !== 1 ? 's' : ''}
      </span>
    </div>
    <div className="flex items-center justify-center sm:justify-start mb-6">
      <div className="flex gap-2">
        {(["all", "daily", "count"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setPricingTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              pricingTab === tab
                ? "bg-[#9CD321] text-black"
                : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
            }`}
          >
            {tab === "all" ? "ALL" : tab === "daily" ? "DAILY" : "COUNT"}
          </button>
        ))}
      </div>
    </div>

    {filteredPlans.length === 0 ? (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <ShoppingCart className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Plans Found</h3>
        <p className="text-gray-400">No {pricingTab} plans available. Try another tab.</p>
      </div>
    ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
      {filteredPlans.map((plan) => {
        const idNum = parseInt(
          plan.id.replace(/\D/g, "").substring(0, 8) || "0",
          10
        );
        const hue = (idNum * 47 + 185) % 360; // cyan-biased hue
        const borderColor = `hsl(${hue}, 70%, 60%)`;
        const glowColor = `hsla(${hue}, 70%, 60%, 0.15)`;
        const accentFrom = `hsl(${hue}, 55%, 30%)`;
        const accentTo = `hsl(${(hue + 40) % 360}, 55%, 30%)`;

        const features: string[] = [];
        if (plan.validity) features.push(`Valid for ${plan.validity}`);
        if (plan.recognition)
          features.push(`${plan.recognition} Recognition`);
        if (plan.type === "count" && plan.count)
          features.push(`${plan.count.toLocaleString()} Captchas`);
        if (plan.type === "daily" && plan.dailyLimit)
          features.push(`${plan.dailyLimit.toLocaleString()}/day limit`);
        if (plan.type === "minute" && plan.rateLimit)
          features.push(`${plan.rateLimit}/minute rate`);

        return (
          <div
            key={plan.id}
            className="group relative rounded-2xl overflow-hidden backdrop-blur-xl bg-white/[0.04] flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
            style={{
              border: `1px solid ${borderColor}`,
              boxShadow: `0 4px 30px ${glowColor}`,
            }}
          >
            {/* Animated accent line */}
            <div
              className="absolute top-0 left-0 w-full h-[3px] z-20"
              style={{
                background: `linear-gradient(90deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 60) % 360}, 80%, 55%), hsl(${(hue + 120) % 360}, 70%, 55%))`,
              }}
            />
            {/* Hover glow */}
            <div
              className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ boxShadow: `0 0 50px 10px ${glowColor}` }}
            />

            {/* Header area with image */}
            <div className="relative w-full h-[180px] sm:h-[240px] overflow-hidden">
              <img
                src="https://res.cloudinary.com/dxilo3mlg/image/upload/f_auto,q_auto/v1778159344/trader-id-cards/zk3fxn23qji5irzwka80.webp"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

              {/* Type badge */}
              <div className="absolute top-3 left-3 z-10">
                <span
                  className="px-3 py-1 backdrop-blur-sm text-[10px] rounded-lg font-semibold border border-white/20 shadow-lg text-white"
                  style={{
                    backgroundColor: `hsla(${hue}, 40%, 35%, 0.6)`,
                  }}
                >
                  {typeLabels[plan.type] || plan.type}
                </span>
              </div>

              {/* Promo badge */}
              {plan.isPromo && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-md shadow-amber-500/30">
                    Promo
                  </span>
                </div>
              )}

              {/* Code badge */}
              <div className="absolute top-12 left-3 z-10">
                <span className="px-2 py-0.5 backdrop-blur-sm text-[9px] rounded-full font-semibold border border-white/20 shadow-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                  {plan.code}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 flex flex-col flex-1 space-y-3">
              {/* Title */}
              <h3 className="text-sm sm:text-base font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent line-clamp-1">
                {plan.code} — {typeLabels[plan.type] || plan.type}
              </h3>

              {/* Features */}
              <div className="space-y-1.5 flex-1 overflow-hidden">
                {features.slice(0, 4).map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{
                        backgroundColor: `hsl(${(hue + idx * 50) % 360}, 60%, 60%)`,
                      }}
                    />
                    <span className="text-xs text-gray-400 line-clamp-1">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price & Action */}
              <div
                className="pt-3"
                style={{
                  borderTop: `1px solid hsla(${hue}, 50%, 55%, 0.12)`,
                }}
              >
                {/* Price block */}
                <div
                  className="rounded-xl p-3 text-center mb-3 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, hsla(${hue}, 50%, 55%, 0.08), hsla(${(hue + 80) % 360}, 50%, 55%, 0.08))`,
                    border: `1px solid hsla(${hue}, 50%, 55%, 0.12)`,
                  }}
                >
                  {captchaDiscount.discountEnabled && captchaDiscount.discountPercent > 0 ? (
                    <>
                      {/* Discounted price */}
                      <span
                        className="text-base sm:text-lg font-extrabold"
                        style={{
                          backgroundImage: `linear-gradient(90deg, hsl(${(hue + 30) % 360}, 70%, 65%), hsl(${(hue + 90) % 360}, 80%, 65%))`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        ${formatPrice(Math.round(plan.priceValue * (1 - captchaDiscount.discountPercent / 100) * 100) / 100, 2)} USD
                      </span>
                      {/* Original price struck through */}
                      <div className="text-xs text-gray-500 line-through mt-0.5">
                        ${formatPrice(plan.priceValue, 2)} USD
                      </div>
                      {/* Discount badge */}
                      <div
                        className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                        style={{ background: `linear-gradient(135deg, hsl(${(hue + 30) % 360}, 70%, 50%), hsl(${(hue + 90) % 360}, 80%, 50%))` }}
                      >
                        -{captchaDiscount.discountPercent}%
                      </div>
                    </>
                  ) : (
                    <span
                      className="text-base sm:text-lg font-extrabold"
                      style={{
                        backgroundImage: `linear-gradient(90deg, hsl(${hue}, 70%, 70%), hsl(${(hue + 60) % 360}, 80%, 70%))`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      ${formatPrice(plan.priceValue, 2)} USD
                    </span>
                  )}
                  <div
                    className="absolute top-2 right-2 w-2 h-2 rounded-full opacity-60 animate-pulse"
                    style={{ backgroundColor: borderColor }}
                  />
                </div>

                {/* Add to Cart button — use discounted price */}
                {(() => {
                  const discountedPriceUSD = captchaDiscount.discountEnabled && captchaDiscount.discountPercent > 0
                    ? Math.round(plan.priceValue * (1 - captchaDiscount.discountPercent / 100) * 100) / 100
                    : plan.priceValue;
                  const effectiveRate = captchaDiscount.exchangeRate || exchangeRate || 110;
                  const discountedPriceBDT = Math.round(discountedPriceUSD * effectiveRate * 100) / 100;
                  return (
                  <button
                    onClick={() =>
                      addToCart({
                        id: `cm-${plan.code}`,
                        name: `Captcha Solver Api — ${plan.code}`,
                        description: `${typeLabels[plan.type] || plan.type} — $${formatPrice(discountedPriceUSD, 2)}`,
                        price: discountedPriceUSD,
                        originalPrice: plan.priceValue,
                        priceBDT: discountedPriceBDT,
                        priceUSDT: discountedPriceUSD,
                        category: 'Captcha Solver Api',
                        features: features.slice(0, 3),
                        available: true,
                      })
                    }
                  className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-white transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, hsl(${hue}, 60%, 45%), hsl(${(hue + 60) % 360}, 70%, 45%))`,
                    boxShadow: `0 4px 20px hsla(${hue}, 70%, 50%, 0.25)`,
                  }}
                >
                  {lastAddedProductId === `cm-${plan.code}` ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Add to Cart
                    </>
                  )}
                </button>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
    )}
    </>
  );
}

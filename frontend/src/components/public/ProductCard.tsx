import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, CheckCircle2, ExternalLink, Clock } from "lucide-react";
import CampaignBadge from "./campaign/CampaignBadge";
import CountdownTimer from "./campaign/CountdownTimer";
import type { Product } from "../../types";
import { formatPrice } from "../../utils/formatPrice";

export interface ProductCardProps {
  product: Product;
  lastAddedProductId: string | number | null;
  addToCart: (product: Product) => void;
  showStock?: boolean;
}

const ProductCard = React.memo(function ProductCard({
  product,
  lastAddedProductId,
  addToCart,
  showStock,
}: ProductCardProps) {
  const shouldShowStock = showStock !== undefined ? showStock : !!product.showStock;
  const navigate = useNavigate();
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const [imgLoaded, setImgLoaded] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const [cardEntered, setCardEntered] = React.useState(false);
  React.useEffect(() => {
    if (isVisible) {
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setCardEntered(true)));
      return () => cancelAnimationFrame(raf);
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div ref={ref} className="min-h-[400px]">
        <div className="w-full h-[400px] rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    transform: cardEntered ? 'translateY(0)' : 'translateY(12px)',
    transition: 'transform 400ms ease-out, box-shadow 400ms ease-out',
  };

  const inCart = lastAddedProductId === product.id;
  const idNumber = typeof product.id === 'number' ? product.id : parseInt(String(product.id).replace(/\D/g, '').substring(0, 8) || '0', 10);
  const hue = (idNumber * 47) % 360;
  const borderColor = `hsl(${hue}, 70%, 60%)`;
  const accentFrom = `hsl(${hue}, 55%, 30%)`;
  const accentTo = `hsl(${(hue + 40) % 360}, 55%, 30%)`;
  const glowColor = `hsla(${hue}, 70%, 60%, 0.12)`;
  const priceGrad = `hsl(${hue}, 70%, 70%), hsl(${(hue + 60) % 360}, 80%, 70%)`;
  const categorySlug = (product.category || "general")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return (
    <div ref={ref} className="group relative rounded-2xl overflow-hidden backdrop-blur-xl bg-white/[0.04] flex flex-col transition-transform duration-500 hover:-translate-y-2 hover:shadow-2xl" style={{ ...cardStyle, border: `1px solid ${borderColor}`, boxShadow: `0 4px 30px ${glowColor}` }}
    >
      <div className="absolute top-0 left-0 w-full h-[3px] z-20" style={{ background: `linear-gradient(90deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 60) % 360}, 80%, 55%), hsl(${(hue + 120) % 360}, 70%, 55%))` }} />
      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: `0 0 50px 10px ${glowColor}` }} />

      <div className="relative w-full h-[200px] overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }} />
        {(product.images?.[0] || product.imageUrl) && !imgError ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer" />
            )}
            <img
              src={product.images?.[0] || product.imageUrl || ''}
              alt={product.name}
              className={`relative w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onError={() => setImgError(true)}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-white/20" style={{ background: `hsla(${hue}, 55%, 40%, 0.5)` }}>
              <span className="text-3xl font-bold" style={{ color: `hsl(${hue}, 60%, 80%)` }}>
                {product.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 backdrop-blur-sm text-[10px] rounded-lg font-semibold border border-white/20 shadow-lg text-white" style={{ backgroundColor: `hsla(${hue}, 40%, 35%, 0.6)` }}>
            {product.category}
          </span>
        </div>

        {product.available === true && !product.campaignBadge && (
          <div className="absolute top-12 left-3">
            <span className="px-2 py-0.5 backdrop-blur-sm text-[9px] rounded-full font-semibold border border-white/20 shadow-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white">
              Available
            </span>
          </div>
        )}
        {product.available === false && (
          <div className="absolute top-12 left-3">
            <span className="px-2 py-0.5 backdrop-blur-sm text-[9px] rounded-full font-semibold border border-white/20 shadow-lg bg-gradient-to-r from-red-500 to-orange-500 text-white">
              Unavailable
            </span>
          </div>
        )}

        {product.campaignBadge && (
          <div className="absolute top-12 left-3 z-10">
            <CampaignBadge
              name={product.campaignBadge}
              slug={product.campaignSlug || ""}
              color={product.campaignColor || "#ef4444"}
              discountPercent={product.campaignDiscount}
              amountSaved={product.campaignAmountSaved}
              compact
            />
            {product.campaignEndDate && (
              <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 w-fit">
                <Clock className="w-2.5 h-2.5 text-red-400" />
                <CountdownTimer endDate={product.campaignEndDate} colorTheme="#ef4444" compact />
              </div>
            )}
          </div>
        )}

        {inCart && (
          <div className="absolute top-3 right-3">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 backdrop-blur-md text-white text-xs font-bold shadow-lg shadow-emerald-500/30 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" /> Added
            </div>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent line-clamp-1">
            {product.name}
          </h3>
        </div>

        <div className="space-y-2 flex-1 overflow-hidden">
          {product.smmProvider ? (
            /* SMM product details — feature dot list */
            <div className="space-y-1.5">
              {product.smmMin != null && (
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: `hsl(${hue}, 60%, 60%)` }} />
                  <span className="text-xs text-gray-400 line-clamp-1">
                    Minimum Order: <span className="font-semibold text-blue-300">{product.smmMin}</span>
                  </span>
                </div>
              )}
              {product.smmMax != null && (
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: `hsl(${(hue + 50) % 360}, 60%, 60%)` }} />
                  <span className="text-xs text-gray-400 line-clamp-1">
                    Maximum Order: <span className="font-semibold text-blue-300">{product.smmMax}</span>
                  </span>
                </div>
              )}
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: `hsl(${(hue + 100) % 360}, 60%, 60%)` }} />
                <span className="text-xs text-gray-400 line-clamp-1">
                  Rate: <span className="font-semibold text-white">৳{formatPrice(product.price, 2)}</span><span className="text-gray-500">/1000</span>
                </span>
              </div>
              {product.description && (
                <div className="flex items-start space-x-2 pt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: `hsl(${(hue + 150) % 360}, 60%, 60%)` }} />
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Regular product features */
            product.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: `hsl(${(hue + index * 50) % 360}, 60%, 60%)` }} />
                <span className="text-xs text-gray-400 line-clamp-1">
                  {feature}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="pt-3" style={{ borderTop: `1px solid hsla(${hue}, 50%, 55%, 0.12)` }}>
          <div className="rounded-xl p-3 text-center mb-3 relative overflow-hidden" style={{ background: `linear-gradient(135deg, hsla(${hue}, 50%, 55%, 0.08), hsla(${(hue + 80) % 360}, 50%, 55%, 0.08))`, border: `1px solid hsla(${hue}, 50%, 55%, 0.12)` }}>
            {product.campaignPrice && product.campaignPrice < product.price ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-extrabold" style={{ backgroundImage: `linear-gradient(90deg, ${priceGrad})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ৳{formatPrice(product.campaignPrice, 2)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ৳{formatPrice(product.price, 2)}
                </span>
                {product.campaignDiscount && product.campaignDiscount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${product.campaignColor || '#ef4444'}22`, color: product.campaignColor || '#ef4444' }}>
                    -{Math.round(product.campaignDiscount)}%
                  </span>
                )}
              </div>
            ) : product.smmProvider ? (
              /* SMM price: show per-1000 rate in BDT + USDT */
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-lg font-extrabold" style={{ backgroundImage: `linear-gradient(90deg, ${priceGrad})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    ৳{formatPrice(product.price, 2)}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">/1000</span>
                </div>
                {product.priceUSDT != null && product.priceUSDT > 0 && (
                  <span className="text-[11px] font-medium text-gray-400">
                    ${formatPrice(product.priceUSDT, 2)} USDT
                  </span>
                )}
              </div>
            ) : (
              <span className="text-lg font-extrabold" style={{ backgroundImage: `linear-gradient(90deg, ${priceGrad})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ৳{formatPrice(product.price, 2)}
              </span>
            )}
            {shouldShowStock && product.stock !== undefined && !product.smmProvider && (
              <div className="mt-1.5 text-xs">
                <span className={`font-medium ${product.stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  Stock: {product.stock} {product.stock > 0 ? 'available' : 'out of stock'}
                </span>
              </div>
            )}
            {product.smmProvider && product.smmMax != null && (
              <div className="mt-1.5 text-xs">
                <span className="font-medium text-blue-300">
                  Max Order: {product.smmMax}
                </span>
              </div>
            )}
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full opacity-60 animate-pulse" style={{ backgroundColor: borderColor }} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/product/${categorySlug}/${product.seoSlug || product.dbId || product.id}`)}
              className="flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
                color: '#93c5fd',
                border: '1px solid rgba(139,92,246,0.2)',
              }}
            >
              <span className="hover:text-white transition-colors flex items-center justify-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Details
              </span>
            </button>
            <button
              onClick={() => addToCart(product)}
              disabled={(product.stock === 0 && !product.smmProvider) || product.available === false}
              className={`flex-1 px-3 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-transform duration-300 text-xs shadow-lg ${
                inCart
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/20"
                  : (product.stock === 0 && !product.smmProvider) || product.available === false
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "text-white"
              }`}
              style={inCart ? {} : (product.stock === 0 && !product.smmProvider) || product.available === false ? {} : {
                background: `linear-gradient(135deg, hsl(${hue}, 60%, 45%), hsl(${(hue + 60) % 360}, 70%, 45%))`,
                boxShadow: `0 4px 20px hsla(${hue}, 70%, 50%, 0.25)`,
              }}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {inCart ? "In Cart" : product.available === false ? "Unavailable" : product.stock === 0 && !product.smmProvider ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;

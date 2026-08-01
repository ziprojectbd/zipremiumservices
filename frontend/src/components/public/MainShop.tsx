import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import CategoryFilterBar from "./CategoryFilterBar";
import CaptchaSolvesApiCards from "./CaptchaSolvesApiCards";
import { useShopContext } from "../../store/ShopContext";
import { devLog } from "../../utils/devLogger";
import api from "../../lib/axios";
import type { ShopProduct } from "../../types";

interface MainShopProps {
  categorySlug?: string;
}

export default function MainShop({ categorySlug = "all" }: MainShopProps) {
  const navigate = useNavigate();
  const { addToCart, lastAddedProductId, setIsLoading } = useShopContext();

  const [categories, setCategories] = useState<any[]>([]);

  // Resolve categorySlug → category name synchronously (no render gap)
  const selectedCategory = useMemo(() => {
    if (!categories.length) return "All";
    const cat = categories.find(
      (c) =>
        c.slug === categorySlug ||
        c.name.toLowerCase().replace(/\s+/g, "-") === categorySlug
    );
    return cat ? cat.name : "All";
  }, [categorySlug, categories]);

  // Track which category the currently-rendered products belong to.
  // Updated after a successful fetch, so the render can detect mismatches
  // synchronously — before the useEffect that clears apiProducts fires.
  const productsCategoryRef = useRef<string>("All");

  // Fetch categories
  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        const json = res.data;
        if (json.success && json.data) {
          const injected = [
            ...json.data,
            {
              name: "Captcha Solver Api",
              slug: "captcha-solver-api",
              icon: "🤖",
              gradient: "from-cyan-500 to-blue-500",
              productCount: 0,
            },
          ];
          if (!cancelled) setCategories(injected);
        }
      } catch (error) {
        devLog("Error fetching categories:", error);
      }
    };
    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  // Products state
  const [apiProducts, setApiProducts] = useState<ShopProduct[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 50;
  const lastCategoryRef = useRef<string>("");
  const requestIdRef = useRef(0);

  const fetchProductsPage = useCallback(
    async (page: number, categoryName: string, append: boolean = false) => {
      const requestId = requestIdRef.current;
      try {
        const params: any = { page: page.toString(), limit: PAGE_SIZE.toString() };
        if (categoryName && categoryName !== "All") {
          params.category = categoryName;
        }

        const res = await api.get("/products", { params });
        // Discard stale responses when a newer request is in flight
        if (requestId !== requestIdRef.current) return;
        const json = res.data;
        if (json.success && json.data) {
          const mapped: ShopProduct[] = json.data.map((p: any, idx: number) => {
            const descLines = (p.description || "")
              .split("\n")
              .map((l: string) => l.trim())
              .filter((l: string) => l.length > 0)
              .slice(0, 5);
            return {
              id: p._id || `product-${idx}`,
              name: p.name,
              description: descLines.length > 0 ? "" : p.description || "",
              price: p.priceBDT || p.priceUSDT || p.price || 0,
              priceBDT: p.priceBDT,
              priceUSDT: p.priceUSDT,
              originalPrice: p.priceUSDT || p.price || 0,
              category: p.category,
              icon: undefined as any,
              features: descLines.length > 0 ? descLines : p.features || [],
              rating: 4.8,
              reviews: p.sales || 0,
              imageUrl: p.imageUrl,
              stock: p.stock,
              available: Boolean(p.available),
              showStock: p.smmProvider ? false : Boolean(p.showStock),
              showImageSlider: p.showImageSlider !== false,
              dbId: p._id,
              seoSlug: p.seoSlug,
              details: p.details,
              smmProvider: p.smmProvider || undefined,
              smmServiceId: p.smmServiceId || undefined,
              smmMin: p.smmMin || undefined,
              smmMax: p.smmMax || undefined,
            };
          });

          if (requestId !== requestIdRef.current) return;
          setApiProducts((prev) => (append ? [...prev, ...mapped] : mapped));
          setHasMoreProducts(json.pagination?.page < json.pagination?.pages);
          setTotalProducts(json.pagination?.total || 0);
          setCurrentPage(page);
        }
      } catch (e) {
        if (requestId !== requestIdRef.current) return;
        devLog("Failed to fetch products:", e);
      }
    },
    []
  );

  // Fetch products when selectedCategory changes
  useEffect(() => {
    if (lastCategoryRef.current === selectedCategory) return;
    lastCategoryRef.current = selectedCategory;

    // Increment request ID to cancel any in-flight requests
    requestIdRef.current += 1;

    // Clear old products and set loading immediately in the same batch
    setApiProducts([]);
    setApiLoading(true);
    setCurrentPage(1);
    setHasMoreProducts(false);
    setIsLoadingMore(false);

    async function loadProducts() {
      await fetchProductsPage(1, selectedCategory, false);
      productsCategoryRef.current = selectedCategory;
      setApiLoading(false);
    }
    loadProducts();
  }, [selectedCategory, fetchProductsPage]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreProducts) return;
    setIsLoadingMore(true);
    await fetchProductsPage(currentPage + 1, selectedCategory, true);
    setIsLoadingMore(false);
  };

  const isCaptchaCategory =
    selectedCategory === "Captcha Solver Api" ||
    categorySlug === "captcha-solver-api";
  const isTradeCategory = selectedCategory === "Trade";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {categories.length > 0 && (
        <CategoryFilterBar
          selectedCategory={selectedCategory}
          router={navigate}
          containerClassName="mb-6 sm:mb-8"
          categories={categories}
        />
      )}

      {/* Special Offer Promo Banner (only on "all") */}
      {categorySlug === "all" && (
        <button
          onClick={() => navigate("/special-offer")}
          className="group relative w-full mb-6 sm:mb-8 overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-600/20 via-amber-600/15 to-yellow-600/20 p-4 sm:p-5 text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-orange-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 2.879a3 3 0 00-4.242 0L3.04 9.718a3 3 0 00-.879 2.122v9.657a.75.75 0 00.75.75h18a.75.75 0 00.75-.75v-9.657a3 3 0 00-.879-2.122l-6.839-6.84a3 3 0 00-4.242 0zM9.75 21v-6a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v6" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">
                Special Offers
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Check out our latest deals and limited-time discounts
              </p>
            </div>
            <div className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold group-hover:bg-orange-500/30 transition-colors">
              View All
            </div>
          </div>
        </button>
      )}

      {/* Captcha Solver Api Cards */}
      {isCaptchaCategory && (
        <div className="transform transition-all duration-300 ease-out">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Our Bot Access Api Plans
              </h2>
            </div>
          </div>
          <CaptchaSolvesApiCards
            lastAddedProductId={lastAddedProductId}
            addToCart={addToCart}
          />
        </div>
      )}

      {/* Products Grid */}
      {!isTradeCategory && !isCaptchaCategory && (() => {
          const categoryMismatch = selectedCategory !== productsCategoryRef.current;
          const showSkeletons = apiLoading || categoryMismatch;
          return (
        <div className="transform transition-all duration-300 ease-out">
          <div id="products" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {showSkeletons
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`product-skeleton-${index}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse"
                  >
                    <div className="h-40 rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer" />
                    <div className="mt-4 h-5 w-2/3 rounded bg-white/10" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-white/10" />
                    <div className="mt-6 h-10 w-full rounded-xl bg-white/10" />
                  </div>
                ))
              : apiProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    lastAddedProductId={lastAddedProductId}
                    showStock={product.showStock}
                    addToCart={addToCart}
                  />
                ))}
          </div>

          {hasMoreProducts && (
            <div className="text-center mb-16">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-8 py-3 bg-white/5 border border-purple-500/30 text-purple-300 rounded-xl hover:bg-purple-500/10 hover:border-purple-400/50 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  `See More (${Math.min(PAGE_SIZE, totalProducts - apiProducts.length)} more)`
                )}
              </button>
            </div>
          )}

          {!apiLoading && !hasMoreProducts && apiProducts.length > 0 && (
            <div className="text-center mb-16 text-gray-500 text-sm">
              Showing all {totalProducts} products
            </div>
          )}
        </div>
      )})()}

      {/* Trade category: products ARE shown here */}
      {isTradeCategory && !isCaptchaCategory && (() => {
          const categoryMismatch = selectedCategory !== productsCategoryRef.current;
          const showSkeletons = apiLoading || categoryMismatch;
          return (
        <div className="transform transition-all duration-300 ease-out">
          <div id="products" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {showSkeletons
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`product-skeleton-${index}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse"
                  >
                    <div className="h-40 rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer" />
                    <div className="mt-4 h-5 w-2/3 rounded bg-white/10" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-white/10" />
                    <div className="mt-6 h-10 w-full rounded-xl bg-white/10" />
                  </div>
                ))
              : apiProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    lastAddedProductId={lastAddedProductId}
                    showStock={product.showStock}
                    addToCart={addToCart}
                  />
                ))}
          </div>
        </div>
      )})()}

      {/* Get In Touch section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-3xl shadow-2xl p-5 sm:p-8 mb-16 border border-gray-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-6">
            <div className="relative inline-block">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                Get In Touch
              </h3>
              <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
            </div>
            <p className="text-gray-300 leading-relaxed text-lg">
              Have questions about our services? Need help with your order? Contact
              us and we'll get back to you within 24 hours.
            </p>
            <div className="space-y-4">
              <a
                href="https://wa.me/message/HAOATN77ES6PL1"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center space-x-4 p-5 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl hover:from-green-500/20 hover:to-green-600/10 transition-all duration-500 border border-white/10 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/20 transform hover:-translate-y-1 no-underline"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/0 to-green-400/0 group-hover:from-green-500/10 group-hover:to-green-400/5 transition-all duration-500"></div>
                <div className="relative p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-green-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="relative">
                  <div className="text-sm text-green-300 font-medium tracking-wide uppercase">Phone</div>
                  <div className="text-white font-semibold text-lg group-hover:text-green-200 transition-colors duration-300 flex items-center gap-2">
                    WhatsApp
                    <span className="text-xs bg-green-500/30 text-green-300 px-2 py-0.5 rounded-full">Online</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-green-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ml-auto" />
              </a>

              <div className="group relative flex items-center space-x-4 p-5 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl hover:from-red-500/20 hover:to-red-600/10 transition-all duration-500 border border-white/10 hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/20 transform hover:-translate-y-1 cursor-pointer">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/0 to-red-400/0 group-hover:from-red-500/10 group-hover:to-red-400/5 transition-all duration-500"></div>
                <div className="relative p-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-red-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div className="relative">
                  <div className="text-sm text-red-300 font-medium tracking-wide uppercase">Location</div>
                  <div className="text-white font-semibold text-lg group-hover:text-red-200 transition-colors duration-300">
                    Dhaka, Bangladesh
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

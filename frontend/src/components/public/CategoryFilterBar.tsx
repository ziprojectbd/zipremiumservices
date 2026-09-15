import { devLog } from "../../utils/devLogger";
import { useEffect, useRef, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import api from "../../lib/axios";

interface Category {
  name: string;
  icon: string;
  gradient: string;
  slug?: string;
  productCount?: number;
}

interface CategoryFilterBarProps {
  selectedCategory: string;
  router: NavigateFunction;
  containerClassName?: string;
  categories?: Category[];
}

export default function CategoryFilterBar({ selectedCategory, router, containerClassName, categories: propCategories }: CategoryFilterBarProps) {
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<Category[]>(propCategories || []);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setCategories(propCategories);
      return;
    }

    if (propCategories === undefined) {
      const fetchCategories = async () => {
        try {
          const res = await api.get('/categories');
          const json = res.data;
          if (json.success && json.data && json.data.length > 0) {
            setCategories(json.data);
          } else {
            devLog('No categories found in database');
          }
        } catch (err) {
          devLog('Failed to fetch categories:', err);
        }
      };
      fetchCategories();
    }
  }, [propCategories]);

  // Desktop: translate the mouse wheel into horizontal scrolling. A plain
  // vertical wheel over an `overflow-x-auto` container does nothing on
  // Windows/Linux, which made the filter bar feel unscrollable. Trackpad
  // horizontal pans (deltaX) are left to the browser, and reaching either end
  // releases the wheel so the page keeps scrolling normally.
  useEffect(() => {
    const el = desktopScrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      // Trackpad horizontal gesture — let the browser handle it.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY === 0) return;

      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;

      // At an edge, let the page scroll instead of swallowing the wheel.
      if ((atStart && e.deltaY < 0) || (atEnd && e.deltaY > 0)) return;

      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Desktop: click-and-drag scrolling. A drag past the threshold suppresses the
  // click so dragging never triggers a category navigation.
  useEffect(() => {
    const el = desktopScrollRef.current;
    if (!el) return;

    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (el.scrollWidth <= el.clientWidth) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const delta = e.clientX - startX;
      if (Math.abs(delta) > 4) moved = true;
      el.scrollLeft = startScroll - delta;
    };

    const stop = () => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = '';
      el.style.userSelect = '';
    };

    // Capture phase: swallow the click that ends a drag.
    const onClickCapture = (e: MouseEvent) => {
      if (!moved) return;
      e.stopPropagation();
      e.preventDefault();
      moved = false;
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stop);
    el.addEventListener('click', onClickCapture, true);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stop);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  // Keep the active category centered in the bar when selection changes.
  // scrollLeft is set directly so the page itself never scrolls.
  useEffect(() => {
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
    const container = (isDesktop ? desktopScrollRef.current : mobileScrollRef.current);
    if (!container) return;

    const active = container.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) return;

    const target = active.offsetLeft - (container.clientWidth - active.clientWidth) / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [selectedCategory, categories.length]);

  const renderItems = (variant: 'mobile' | 'desktop') =>
    categories.map((category) => {
      const slug = category.name === "All" ? "all" : category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
      const isActive = selectedCategory === category.name;

      if (variant === 'mobile') {
        return (
          <button
            key={category.name}
            data-active={isActive}
            onClick={() => router(slug === "all" ? "/" : `/${slug}`)}
            className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-200 border whitespace-nowrap ${
              isActive
                ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg shadow-purple-500/20 border-white/20 scale-105`
                : "bg-white/10 text-white/70 hover:text-white hover:bg-white/20 hover:shadow-lg hover:shadow-purple-500/10 border-white/10 hover:border-white/30"
            }`}
          >
            <span className={`text-base ${isActive ? 'text-white' : 'text-white/70'}`}>{category.icon}</span>
            <span className={`text-xs font-semibold tracking-tight ${isActive ? 'text-white' : 'text-white/70'}`}>{category.name}</span>
          </button>
        );
      }

      return (
        <button
          key={category.name}
          data-active={isActive}
          onClick={() => router(slug === "all" ? "/" : `/${slug}`)}
          className={`snap-start shrink-0 relative px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg transition-all duration-200 font-semibold shadow-md overflow-hidden group flex items-center gap-1 sm:gap-2 backdrop-blur-sm border whitespace-nowrap ${
            isActive
              ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg border-white/20 scale-105`
              : "bg-white/10 text-white/80 hover:text-white hover:bg-white/20 hover:shadow-lg hover:scale-102 border-white/10 hover:border-white/30"
          }`}
        >
          <span className={`text-xs sm:text-base filter drop-shadow-sm ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
            {category.icon}
          </span>
          <span className="relative z-10 text-[10px] sm:text-sm font-semibold tracking-tight">
            {category.name}
          </span>

          {isActive && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer bg-[length:200%_100%]"></div>
              <div className="absolute -inset-0.5 bg-gradient-to-r opacity-20 blur-sm group-hover:opacity-30 transition-opacity duration-300"></div>
            </>
          )}

          {!isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          )}
        </button>
      );
    });

  return (
    <>
      <div id="category-filters" className={`${containerClassName || ""} relative md:hidden`}>
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900 to-transparent z-10 rounded-l-2xl"></div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900 to-transparent z-10 rounded-r-2xl"></div>

        <div
          ref={mobileScrollRef}
          className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide py-2 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {renderItems('mobile')}
        </div>

        <div className="flex justify-center gap-1 mt-1.5">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className={`h-1 rounded-full transition-all duration-300 ${
                selectedCategory === cat.name ? "w-4 bg-purple-400" : "w-1 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      <div id="category-filters" className={`${containerClassName || ""} relative hidden md:block`}>
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-950 to-transparent z-10 rounded-l-2xl"></div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-950 to-transparent z-10 rounded-r-2xl"></div>

        <div
          ref={desktopScrollRef}
          className="flex flex-nowrap gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-1 snap-x cursor-grab"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {renderItems('desktop')}
        </div>
      </div>
    </>
  );
}

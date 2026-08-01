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
  const scrollRef = useRef<HTMLDivElement>(null);
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

  return (
    <>
      <div id="category-filters" className={`${containerClassName || ""} relative md:hidden`}>
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900 to-transparent z-10 rounded-l-2xl"></div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900 to-transparent z-10 rounded-r-2xl"></div>

        <div
          ref={scrollRef}
          className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide py-2 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {categories.map((category) => {
            const slug = category.name === "All" ? "all" : category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
            const isActive = selectedCategory === category.name;
            return (
              <button
                key={category.name}
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
          })}
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
          ref={scrollRef}
          className="flex flex-nowrap gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {categories.map((category) => {
            const slug = category.name === "All" ? "all" : category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
            const isActive = selectedCategory === category.name;
            return (
              <button
                key={category.name}
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
          })}
        </div>
      </div>
    </>
  );
}

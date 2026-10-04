import { devLog } from "../../utils/devLogger";
import { useEffect, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import api from "../../lib/axios";
import CategoryChip, {
  CategoryChipRow,
  CategoryChipCount,
} from "../shared/CategoryChip";

interface Category {
  name: string;
  icon: string;
  gradient: string;
  slug?: string;
  /** Products a customer can browse in this category (from /categories). */
  count?: number;
  productCount?: number;
}

interface CategoryFilterBarProps {
  selectedCategory: string;
  router: NavigateFunction;
  containerClassName?: string;
  categories?: Category[];
}

/**
 * The storefront category bar.
 *
 * Renders through the same shared chip components as the admin product filter,
 * so the CSS and the chip contents (icon, gradient, product count) are identical
 * in both places.
 */
export default function CategoryFilterBar({
  selectedCategory,
  router,
  containerClassName,
  categories: propCategories,
}: CategoryFilterBarProps) {
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

  const [scrollProgress, setScrollProgress] = useState(0);

  const handleSelect = (category: Category) => {
    const slug =
      category.name === "All"
        ? "all"
        : category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
    router(slug === "all" ? "/" : `/${slug}`);
  };

  /** Product count for a chip, tolerating either field name. */
  const countOf = (category: Category): number | undefined => {
    const value = category.count ?? category.productCount;
    return typeof value === 'number' ? value : undefined;
  };

  return (
    <div className={containerClassName || ""}>
      <CategoryChipRow 
        fadeFrom="from-slate-950" 
        centerOn={selectedCategory} 
        onProgressChange={setScrollProgress}
      >
        {categories.map((category) => {
          const isActive = selectedCategory === category.name;
          const count = countOf(category);
          const accentColor = category.gradient
            ? category.gradient.split(' ')[0].replace('from-', '').replace(/-\d+$/, '-400')
            : 'text-purple-400';

          return (
            <CategoryChip
              key={category.name}
              label={category.name}
              icon={category.icon || '📦'}
              gradient={category.gradient}
              active={isActive}
              onClick={() => handleSelect(category)}
            >
              {typeof count === 'number' && count > 0 && (
                <CategoryChipCount value={count} active={isActive} color={accentColor} />
              )}
            </CategoryChip>
          );
        })}
      </CategoryChipRow>

      {/* Scroll progress bar */}
      <div className="w-full h-0.5 bg-white/10 rounded mt-1">
        <div
          className={`h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded`}
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>
    </div>
  );
}

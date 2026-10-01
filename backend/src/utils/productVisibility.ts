import SmmSettings from '@models/SmmSettings';
import Category from '@models/Category';
import Product from '@models/Product';

/**
 * One definition of "which products a customer can actually see".
 *
 * The public product list and the public category list must agree, otherwise a
 * category chip can advertise a count the list cannot deliver (or a product
 * exists that has no chip at all). Both endpoints use the helpers below so that
 * can never drift again.
 *
 * The rule: an SMM product (oneservicebd) is only visible when its category is
 * an enabled platform. Non-SMM products are always visible.
 */

/** Categories the admin has enabled for the storefront. */
export async function getEnabledSmmCategories(): Promise<string[]> {
  try {
    const settings = await SmmSettings.findOne().lean();
    return ((settings?.enabledCategories as string[]) || []).filter(Boolean);
  } catch {
    return [];
  }
}

/** Mongo filter restricting SMM products to the enabled categories. */
export function smmVisibilityFilter(enabledCategories: string[]): Record<string, unknown> {
  return {
    $or: [
      { smmProvider: { $ne: 'oneservicebd' } },
      { smmProvider: 'oneservicebd', category: { $in: enabledCategories } },
    ],
  };
}

/** Would this product appear in the public catalogue? */
export function isProductVisible(
  product: { smmProvider?: string | null; category?: string | null },
  enabledCategories: string[],
): boolean {
  if (product.smmProvider !== 'oneservicebd') return true;
  return enabledCategories.includes(String(product.category || ''));
}

// ---------------------------------------------------------------------------
// Category chips
//
// One builder feeds both the storefront chip bar and the admin filter row, so a
// chip looks and counts the same in both places. `icon` and `gradient` travel
// with the chip because the storefront renders them directly in a Tailwind
// gradient class (`bg-gradient-to-r ${gradient}`).
// ---------------------------------------------------------------------------

export interface CategoryChip {
  name: string;
  slug: string;
  icon: string;
  gradient: string;
  sortOrder: number;
  isActive: boolean;
  /** Products a customer can browse in this category. */
  count: number;
  /** Every product in this category, including ones the storefront hides. */
  total: number;
  /** Products hidden from the storefront by the visibility rule. */
  hidden: number;
  /** True for a chip with no backing Category document (an SMM platform). */
  _virtual?: boolean;
}

// Defaults mirror what the storefront has always rendered, so an unstyled
// category looks exactly as it did before.
const DEFAULT_ICON = '\u{1F4E6}'; // 📦
const DEFAULT_GRADIENT = 'from-gray-500 to-slate-500';
const SMM_ICON = '\u{1F4F1}'; // 📱
const SMM_GRADIENT = 'from-purple-500 to-indigo-500';

function slugify(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Build the full chip list plus the "All" chip.
 *
 * Nothing is filtered: each chip carries `count` (storefront) and `total` /
 * `hidden` (admin), letting each caller decide what to show.
 */
export async function buildCategoryChips(): Promise<{ all: CategoryChip; chips: CategoryChip[] }> {
  const [enabledCategories, docs, products] = await Promise.all([
    getEnabledSmmCategories(),
    Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    Product.find({}, { category: 1, smmProvider: 1 }).lean(),
  ]);

  const counts = new Map<string, { count: number; total: number }>();
  for (const product of products) {
    const name = String(product.category || '').trim();
    if (!name) continue;
    const entry = counts.get(name) || { count: 0, total: 0 };
    entry.total += 1;
    if (isProductVisible(product, enabledCategories)) entry.count += 1;
    counts.set(name, entry);
  }

  const toChip = (
    name: string,
    source: { icon?: string; gradient?: string; slug?: string; sortOrder?: number } | undefined,
    virtual: boolean,
  ): CategoryChip => {
    const stats = counts.get(name) || { count: 0, total: 0 };
    return {
      name,
      slug: source?.slug || slugify(name),
      icon: source?.icon || (virtual ? SMM_ICON : DEFAULT_ICON),
      gradient: source?.gradient || (virtual ? SMM_GRADIENT : DEFAULT_GRADIENT),
      sortOrder: source?.sortOrder ?? (virtual ? 99 : 0),
      isActive: true,
      count: stats.count,
      total: stats.total,
      hidden: stats.total - stats.count,
      ...(virtual ? { _virtual: true } : {}),
    };
  };

  const docChips = docs.map((doc) =>
    toChip(String(doc.name), {
      icon: doc.icon,
      gradient: doc.gradient,
      slug: doc.slug,
      sortOrder: doc.sortOrder,
    }, false),
  );

  // Enabled SMM platforms without a Category document get a virtual chip.
  const covered = new Set(docChips.map((c) => c.name.toLowerCase()));
  const virtualChips = enabledCategories
    .filter((platform) => !covered.has(String(platform).toLowerCase()))
    .map((platform) => toChip(String(platform), undefined, true));

  // Every other category that products actually use, so the admin can always
  // reach a product it manages. These carry count 0 when the visibility rule
  // hides them, which is what removes them from the storefront row while keeping
  // them visible (and flagged) in the admin.
  const known = new Set([...docChips, ...virtualChips].map((c) => c.name.toLowerCase()));
  const orphanChips = [...counts.keys()]
    .filter((name) => !known.has(name.toLowerCase()))
    .map((name) => toChip(name, undefined, false));

  const chips = [...docChips, ...virtualChips, ...orphanChips].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );

  const visibleTotal = products.filter((p) => isProductVisible(p, enabledCategories)).length;

  const all: CategoryChip = {
    name: 'All',
    slug: 'all',
    icon: DEFAULT_ICON,
    gradient: DEFAULT_GRADIENT,
    sortOrder: -1,
    isActive: true,
    count: visibleTotal,
    total: products.length,
    hidden: products.length - visibleTotal,
  };

  return { all, chips };
}

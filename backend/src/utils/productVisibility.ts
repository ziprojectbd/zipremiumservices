import SmmSettings from '@models/SmmSettings';

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

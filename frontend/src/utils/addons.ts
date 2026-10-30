import type { ProductAddon } from '../types';

/**
 * Optional paid add-ons ("Need Kolotibablo Auto Login", +30%).
 *
 * A product may offer one or more; selecting them adds their percentages to the
 * line's unit price. This module is the single definition of that maths on the
 * client, and `backend/src/utils/addons.ts` mirrors it for the server, so the
 * displayed price and the validated price can never disagree.
 */

/** Minimal shape this needs from a cart line or order item. */
export interface AddonBearing {
  addons?: ProductAddon[] | null;
  customData?: Record<string, unknown> | null;
}

/** The product's available add-ons on this line. */
export function availableAddons(item: AddonBearing | null | undefined): ProductAddon[] {
  return Array.isArray(item?.addons) ? item!.addons.filter((a) => Boolean(a?.key)) : [];
}

/**
 * The add-on keys the buyer selected.
 *
 * Tolerates the value being a single string, because a lone checkbox could be
 * stored either way by an older client.
 */
export function selectedAddonKeys(item: AddonBearing | null | undefined): string[] {
  const raw = item?.customData?.addons;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string' && raw) return [raw];
  return [];
}

/** The selected add-ons, resolved against what the product actually offers. */
export function selectedAddons(item: AddonBearing | null | undefined): ProductAddon[] {
  const keys = new Set(selectedAddonKeys(item));
  return availableAddons(item).filter((a) => keys.has(String(a.key)));
}

/** Total percentage added by the selected add-ons (30 for a single +30%). */
export function addonPercent(item: AddonBearing | null | undefined): number {
  return selectedAddons(item).reduce((sum, a) => sum + (Number(a.pricePercent) || 0), 0);
}

/** Multiplier applied to the unit price (1.3 for +30%). */
export function addonMultiplier(item: AddonBearing | null | undefined): number {
  return 1 + addonPercent(item) / 100;
}

/** Unit price with the selected add-ons applied. */
export function priceWithAddons(
  price: number,
  item: AddonBearing | null | undefined,
): number {
  const base = Number(price) || 0;
  return base * addonMultiplier(item);
}

/**
 * Default selection for a line being added to the cart: the add-ons flagged
 * `defaultSelected`, unless the caller already supplied a selection.
 */
export function initialAddonSelection(
  addons: ProductAddon[] | undefined | null,
  provided?: unknown,
): string[] {
  if (Array.isArray(provided)) return provided.map(String);
  if (typeof provided === 'string' && provided) return [provided];
  return (Array.isArray(addons) ? addons : [])
    .filter((a) => a?.defaultSelected && a?.key)
    .map((a) => String(a.key));
}

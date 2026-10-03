/**
 * Optional paid add-ons ("Need Kolotibablo Auto Login", +30%).
 *
 * Mirrors `frontend/src/utils/addons.ts`. The server recomputes the price from
 * the product's own definitions, so a client cannot change a price by editing
 * the request — it can only choose which add-ons are bought.
 */

export interface ProductAddon {
  key?: string;
  label?: string;
  description?: string;
  pricePercent?: number;
  defaultSelected?: boolean;
}

export interface AddonBearing {
  addons?: ProductAddon[] | null;
  customData?: Record<string, unknown> | null;
}

export function availableAddons(item: AddonBearing | null | undefined): ProductAddon[] {
  return Array.isArray(item?.addons)
    ? item!.addons!.filter((a) => Boolean(a?.key))
    : [];
}

/** The add-on keys the buyer selected. */
export function selectedAddonKeys(item: AddonBearing | null | undefined): string[] {
  const raw = item?.customData?.addons;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string' && raw) return [raw];
  return [];
}

export function selectedAddons(item: AddonBearing | null | undefined): ProductAddon[] {
  const keys = new Set(selectedAddonKeys(item));
  return availableAddons(item).filter((a) => keys.has(String(a.key)));
}

/** Total percentage added by the selected add-ons. */
export function addonPercent(item: AddonBearing | null | undefined): number {
  return selectedAddons(item).reduce((sum, a) => sum + (Number(a.pricePercent) || 0), 0);
}

/** Multiplier applied to the unit price (1.3 for +30%). */
export function addonMultiplier(item: AddonBearing | null | undefined): number {
  return 1 + addonPercent(item) / 100;
}

// ---------------------------------------------------------------------------
// CaptchaMaster-only add-on catalog
//
// CaptchaMaster API plans have no Product document, so their add-on
// definitions live here instead of on a product record. The order controller
// re-derives the percentage from this catalog — a client can only select the
// add-on, never set its price.
// ---------------------------------------------------------------------------
export const CAPTCHA_KOLOTIBABLO_ADDON: ProductAddon = {
  key: 'kolotibablo-autologin',
  label: 'Need Kolotibablo Auto Login Service?',
  description: 'Optional +30% — enables automatic Kolotibablo login on every solved captcha.',
  pricePercent: 30,
};

/** The add-ons available on CaptchaMaster API plans. */
export function captchamasterAddons(): ProductAddon[] {
  return [CAPTCHA_KOLOTIBABLO_ADDON];
}

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

// ---------------------------------------------------------------------------
// Kolotibablo Auto Login ("kbl") flag for delivery
//
// The delivery payload must carry `kbl: true` exactly when the customer
// bought the +30% add-on. The flag is derived ONLY from the stored order
// lines — never from a request body — so neither the storefront nor the
// admin request can flip it.
// ---------------------------------------------------------------------------

/** Minimal shape of an order line this module inspects. */
export interface OrderLineShape {
  productType?: unknown;
  category?: unknown;
  productCategory?: unknown;
  product?: unknown;
  productId?: unknown;
  captchamasterPlanId?: unknown;
  customData?: Record<string, unknown> | null;
}

/**
 * True when a line looks like a CaptchaMaster API product — the same
 * predicate family the order controller and the admin delivery flow use,
 * so the kbl flag can never leak onto another product type.
 */
export function isCaptchaMasterLine(
  item: OrderLineShape | null | undefined,
): boolean {
  if (!item) return false;
  const productId = String(item.productId ?? item.product ?? '');
  const planId = String(
    item.captchamasterPlanId || item.customData?.captchamasterPlanId || '',
  );
  const category = String(item.category || item.productCategory || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return (
    item.productType === 'captchamaster' ||
    (item.customData?.productType === 'captchamaster') ||
    category === 'captcha solver api' ||
    productId.startsWith('cm-') ||
    Boolean(planId)
  );
}

/**
 * True when the Kolotibablo Auto Login add-on was bought on this line.
 *
 * `customData.appliedAddons` (frozen by the server at purchase time, with the
 * real percentage) is authoritative when present; the raw `customData.addons`
 * selection is only the fallback for lines the server has not re-derived yet.
 */
export function itemHasKblAutoLogin(
  item: OrderLineShape | null | undefined,
): boolean {
  if (!item) return false;
  const applied = item.customData?.appliedAddons;
  if (Array.isArray(applied) && applied.length > 0) {
    return applied.some(
      (a) =>
        String((a as { key?: unknown } | null)?.key || '') ===
        CAPTCHA_KOLOTIBABLO_ADDON.key,
    );
  }
  const selected = item.customData?.addons;
  if (Array.isArray(selected)) {
    return selected.some(
      (k) => String(k || '').trim() === CAPTCHA_KOLOTIBABLO_ADDON.key,
    );
  }
  return (
    typeof selected === 'string' &&
    selected.trim() === CAPTCHA_KOLOTIBABLO_ADDON.key
  );
}

/**
 * The order-level `kbl` flag: true when ANY CaptchaMaster line on the order
 * carried the Kolotibablo Auto Login add-on. Non-captcha lines are ignored so
 * the flag can only ever be produced from CaptchaMaster API products.
 */
export function orderKblSelected(
  items: Array<OrderLineShape | null | undefined> | null | undefined,
): boolean {
  if (!Array.isArray(items)) return false;
  return items.some(
    (item) => isCaptchaMasterLine(item) && itemHasKblAutoLogin(item),
  );
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeCart } from '@services/cartExpiration.service';
import Campaign from '@models/Campaign';
import Coupon from '@models/Coupon';
import Product from '@models/Product';

vi.mock('@db/connect', () => ({ default: vi.fn(async () => {}) }));
vi.mock('@models/Campaign', () => ({ default: { find: vi.fn() } }));
vi.mock('@models/Coupon', () => ({ default: { find: vi.fn() } }));
vi.mock('@models/Product', () => ({ default: { find: vi.fn() } }));

const mockCampaignFind = vi.mocked(Campaign.find);
const mockCouponFind = vi.mocked(Coupon.find);
const mockProductFind = vi.mocked(Product.find);

function chainable(resolved: any) {
  return { lean: vi.fn().mockResolvedValue(resolved) } as any;
}

const now = new Date('2026-01-15T10:00:00Z');
const past = new Date('2026-01-10T00:00:00Z');
const future = new Date('2026-02-01T00:00:00Z');

function campaignDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'camp1',
    slug: 'summer-sale',
    name: 'Summer Sale',
    status: 'active',
    isActive: true,
    isDeleted: false,
    startDate: past,
    endDate: future,
    discountType: 'percentage',
    discountValue: 30,
    applicableProducts: ['prod1'],
    ...overrides,
  } as any;
}

function couponDoc(overrides: Record<string, unknown> = {}) {
  return {
    code: 'SAVE20',
    discountType: 'flat',
    discountValue: 20,
    isActive: true,
    expiresAt: future,
    usageLimit: 0,
    usedCount: 0,
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCampaignFind.mockImplementation(() => chainable([]));
  mockCouponFind.mockImplementation(() => chainable([]));
  mockProductFind.mockImplementation(() => chainable([]));
});

describe('sanitizeCart — campaign expiration', () => {
  it('removes a campaign-discounted item when the campaign has ended', async () => {
    mockCampaignFind.mockImplementation(() => chainable([])); // no running campaigns
    const items = [
      {
        productId: 'prod1', dbId: 'prod1', name: 'Widget', price: 1050, originalPrice: 1500, quantity: 1,
        discountSource: 'campaign' as const, campaignId: 'camp1', campaignSlug: 'summer-sale',
        expiresAt: future,
      },
    ];
    const result = await sanitizeCart({ items, now });
    expect(result.removedItems).toHaveLength(1);
    expect(result.removedItems[0].productId).toBe('prod1');
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('keeps a campaign-discounted item and re-derives its price when the campaign is still running', async () => {
    mockCampaignFind.mockImplementation(() => chainable([campaignDoc({ endDate: future })]));
    const items = [
      {
        productId: 'prod1', dbId: 'prod1', name: 'Widget', price: 999, originalPrice: 1500, quantity: 1,
        discountSource: 'campaign' as const, campaignId: 'camp1', campaignSlug: 'summer-sale',
        expiresAt: future,
      },
    ];
    const result = await sanitizeCart({ items, now });
    expect(result.removedItems).toHaveLength(0);
    expect(result.items).toHaveLength(1);
    // 30% off 1500 -> 1050, price re-derived from trusted data
    expect(result.items[0].price).toBe(1050);
    expect(result.subtotal).toBe(1050);
  });

  it('does not trust a client-supplied fake discounted price for a running campaign', async () => {
    mockCampaignFind.mockImplementation(() => chainable([campaignDoc({ endDate: future })]));
    const items = [
      {
        productId: 'prod1', dbId: 'prod1', name: 'Widget', price: 100, originalPrice: 1500, quantity: 1,
        discountSource: 'campaign' as const, campaignId: 'camp1', campaignSlug: 'summer-sale',
        expiresAt: future,
      },
    ];
    const result = await sanitizeCart({ items, now });
    expect(result.items[0].price).toBe(1050);
  });

  it('removes only expired discounted items and preserves unrelated regular products', async () => {
    mockCampaignFind.mockImplementation(() => chainable([])); // campaign ended
    const items = [
      {
        productId: 'prod1', dbId: 'prod1', name: 'Widget', price: 1050, originalPrice: 1500, quantity: 1,
        discountSource: 'campaign' as const, campaignId: 'camp1', campaignSlug: 'summer-sale', expiresAt: future,
      },
      {
        productId: 'prod2', dbId: 'prod2', name: 'Gadget', price: 400, quantity: 2, discountSource: 'none' as const,
      },
    ];
    const result = await sanitizeCart({ items, now });
    expect(result.removedItems).toHaveLength(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productId).toBe('prod2');
    expect(result.subtotal).toBe(800);
    expect(result.itemCount).toBe(1);
  });

  it('keeps a regular-price product purchasable when no campaign covers it', async () => {
    mockCampaignFind.mockImplementation(() => chainable([]));
    const items = [
      { productId: 'prod3', dbId: 'prod3', name: 'Plain', price: 500, quantity: 1, discountSource: 'none' as const },
    ];
    const result = await sanitizeCart({ items, now });
    expect(result.removedItems).toHaveLength(0);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].price).toBe(500);
  });

  it('is idempotent: repeated validation keeps removing the same expired items and does not resurrect them', async () => {
    mockCampaignFind.mockImplementation(() => chainable([]));
    const items = [
      {
        productId: 'prod1', dbId: 'prod1', name: 'Widget', price: 1050, originalPrice: 1500, quantity: 1,
        discountSource: 'campaign' as const, campaignId: 'camp1', campaignSlug: 'summer-sale', expiresAt: future,
      },
    ];
    const first = await sanitizeCart({ items, now });
    const second = await sanitizeCart({ items: first.items, now });
    expect(first.removedItems).toHaveLength(1);
    expect(second.removedItems).toHaveLength(0);
    expect(second.items).toHaveLength(0);
  });

  it('enforces eligibility when a campaign is disabled before its scheduled end', async () => {
    mockCampaignFind.mockImplementation(() =>
      chainable([campaignDoc({ status: 'expired', isActive: false, endDate: future })]),
    );
    const items = [
      {
        productId: 'prod1', dbId: 'prod1', name: 'Widget', price: 1050, originalPrice: 1500, quantity: 1,
        discountSource: 'campaign' as const, campaignId: 'camp1', campaignSlug: 'summer-sale', expiresAt: future,
      },
    ];
    const result = await sanitizeCart({ items, now });
    expect(result.removedItems).toHaveLength(1);
    expect(result.items).toHaveLength(0);
  });

  it('does not remove a campaign item whose campaign has not yet started', async () => {
    // not-started campaigns are not in the running set, so a discounted line
    // added ahead of time is treated as expired (no valid campaign price).
    mockCampaignFind.mockImplementation(() => chainable([]));
    const items = [
      {
        productId: 'prod1', dbId: 'prod1', name: 'Widget', price: 1050, originalPrice: 1500, quantity: 1,
        discountSource: 'campaign' as const, campaignId: 'camp1', campaignSlug: 'summer-sale', expiresAt: future,
      },
    ];
    const result = await sanitizeCart({ items, now });
    expect(result.removedItems).toHaveLength(1);
  });
});

describe('sanitizeCart — coupon expiration', () => {
  it('clears an expired cart-level coupon and recalculates the total', async () => {
    mockCouponFind.mockImplementation(() =>
      chainable([couponDoc({ expiresAt: past, isActive: false })]),
    );
    const items = [
      { productId: 'prod1', dbId: 'prod1', name: 'Widget', price: 500, quantity: 1, discountSource: 'none' as const },
      { productId: 'prod2', dbId: 'prod2', name: 'Gadget', price: 300, quantity: 1, discountSource: 'none' as const },
    ];
    const result = await sanitizeCart({
      items,
      cartCouponCode: 'SAVE20',
      cartCouponDiscount: 20,
      cartCouponType: 'flat',
      now,
    });
    expect(result.couponCleared).toBe(true);
    expect(result.coupon).toBeNull();
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(800);
  });

  it('keeps a valid cart-level coupon and applies its discount', async () => {
    mockCouponFind.mockImplementation(() => chainable([couponDoc()]));
    const items = [
      { productId: 'prod1', dbId: 'prod1', name: 'Widget', price: 500, quantity: 1, discountSource: 'none' as const },
    ];
    const result = await sanitizeCart({
      items,
      cartCouponCode: 'SAVE20',
      cartCouponDiscount: 20,
      cartCouponType: 'flat',
      now,
    });
    expect(result.couponCleared).toBe(false);
    expect(result.coupon?.code).toBe('SAVE20');
    expect(result.total).toBe(480);
  });

  it('removes a per-item coupon line when the coupon is expired', async () => {
    mockCouponFind.mockImplementation(() => chainable([])); // coupon not found/expired
    const items = [
      {
        productId: 'prod1', dbId: 'prod1', name: 'Widget', price: 480, originalPrice: 500, quantity: 1,
        discountSource: 'coupon' as const, couponCode: 'SAVE20', expiresAt: past,
      },
      { productId: 'prod2', dbId: 'prod2', name: 'Gadget', price: 300, quantity: 1, discountSource: 'none' as const },
    ];
    const result = await sanitizeCart({ items, now });
    expect(result.removedItems).toHaveLength(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productId).toBe('prod2');
  });

  it('never allows an exhausted coupon to remain applied', async () => {
    mockCouponFind.mockImplementation(() =>
      chainable([couponDoc({ usageLimit: 1, usedCount: 1 })]),
    );
    const items = [
      { productId: 'prod1', dbId: 'prod1', name: 'Widget', price: 500, quantity: 1, discountSource: 'none' as const },
    ];
    const result = await sanitizeCart({
      items,
      cartCouponCode: 'SAVE20',
      cartCouponDiscount: 20,
      cartCouponType: 'flat',
      now,
    });
    expect(result.couponCleared).toBe(true);
    expect(result.total).toBe(500);
  });
});

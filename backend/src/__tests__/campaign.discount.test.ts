import { describe, it, expect } from 'vitest';
import Campaign from '@models/Campaign';

describe('Campaign.getEffectivePrice — server-side discount', () => {
  it('percentage: ৳1,500 at 33% -> ৳1,005', () => {
    const c = new Campaign({
      discountType: 'percentage',
      discountValue: 33,
      applicableProducts: [],
    });
    expect(c.getEffectivePrice(1500)?.discountPrice).toBe(1005);
  });

  it('fixed_price: ৳1,500 capped at ৳999 -> ৳999', () => {
    const c = new Campaign({
      discountType: 'fixed_price',
      discountValue: 999,
      applicableProducts: [],
    });
    expect(c.getEffectivePrice(1500)?.discountPrice).toBe(999);
  });

  it('fixed_amount: ৳1,500 minus ৳500 -> ৳1,000', () => {
    const c = new Campaign({
      discountType: 'fixed_amount',
      discountValue: 500,
      applicableProducts: [],
    });
    expect(c.getEffectivePrice(1500)?.discountPrice).toBe(1000);
  });

  it('returns null for unsupported discount types', () => {
    const c = new Campaign({
      discountType: 'buy_x_get_y',
      buyX: 1,
      getY: 1,
      applicableProducts: [],
    });
    expect(c.getEffectivePrice(1500)).toBeNull();
  });

  it('returns null for non-positive price', () => {
    const c = new Campaign({
      discountType: 'percentage',
      discountValue: 50,
      applicableProducts: [],
    });
    expect(c.getEffectivePrice(0)).toBeNull();
    expect(c.getEffectivePrice(-10)).toBeNull();
  });
});

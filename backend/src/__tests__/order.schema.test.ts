import { describe, it, expect } from 'vitest';
import Order from '@models/Order';

describe('Order schema — BDT whole-taka rule', () => {
  it('accepts a whole-taka BDT amount on a new order', async () => {
    const order = new Order({ email: 'a@b.com', amount: 999, currency: 'BDT' });
    await expect(order.validate()).resolves.toBeUndefined();
  });

  it('rejects a fractional BDT amount on a new order', async () => {
    const order = new Order({ email: 'a@b.com', amount: 999.5, currency: 'BDT' });
    await expect(order.validate()).rejects.toThrow(/whole number/);
  });

  it('accepts a decimal USDT amount', async () => {
    const order = new Order({ email: 'a@b.com', amount: 4.6, currency: 'USDT' });
    await expect(order.validate()).resolves.toBeUndefined();
  });

  it('rejects a fractional BDT discount amount on a new order', async () => {
    const order = new Order({
      email: 'a@b.com',
      amount: 999,
      currency: 'BDT',
      discountAmount: 10.5,
    });
    await expect(order.validate()).rejects.toThrow(/decimals/);
  });
});

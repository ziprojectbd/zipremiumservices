/**
 * Migration: Fix old orders where amount was stored in wrong currency.
 *
 * Problem: Before the fix, Checkout.tsx sent `totalAmount: getTotalPriceUSD()`
 * for ALL payment methods. For BDT mobile payments (bKash/Nagad/Rocket), the
 * backend stored the USDT-denominated value (e.g. 5.00) with currency "BDT",
 * making it display as ৳5 instead of ৳550.
 *
 * This script detects and fixes those orders by:
 *   1. Finding orders with currency "BDT" and amount suspiciously low (< 30)
 *   2. Multiplying amount by exchangeRate to get the correct BDT value
 *
 * Run: node scripts/fix-order-amounts.mjs
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zipremium';
const EXCHANGE_RATE = parseFloat(process.env.EXCHANGE_RATE || '110');
const THRESHOLD = 30; // BDT orders with amount below this are likely wrong

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB:', MONGODB_URI);

  const db = mongoose.connection.db;
  const orders = db.collection('orders');

  // Find BDT orders with suspiciously low amounts
  const cursor = orders.find({
    currency: 'BDT',
    amount: { $lt: THRESHOLD, $gt: 0 },
    paymentMethod: { $nin: ['paycrypto', 'cod', ''] },
  });

  let fixed = 0;
  let skipped = 0;

  // Also fix items[].usdtAmount if it matches the old wrong amount
  for await (const order of cursor) {
    const oldAmount = order.amount;
    const newAmount = Math.round(oldAmount * EXCHANGE_RATE * 100) / 100;

    console.log(
      `  ${order.orderNumber || order._id}: ${order.currency}${oldAmount} → ${newAmount}` +
      `  (method=${order.paymentMethod}, source=${order.source})`
    );

    const update = {
      $set: { amount: newAmount },
    };

    // Also fix items[].price and items[].usdtAmount if they match the old pattern
    if (order.items && Array.isArray(order.items)) {
      const fixedItems = order.items.map((item) => {
        if (item.usdtAmount != null && item.usdtAmount === oldAmount) {
          return { ...item, usdtAmount: newAmount };
        }
        // If item price matches the old amount, it was stored as USDT value
        if (item.price != null && item.price === oldAmount) {
          return { ...item, price: newAmount, usdtAmount: newAmount };
        }
        return item;
      });
      update.$set.items = fixedItems;
    }

    await orders.updateOne({ _id: order._id }, update);
    fixed++;
  }

  console.log(`\nDone. Fixed ${fixed} orders, skipped ${skipped}.`);

  // Also check USDT orders where amount might be stored as BDT (reverse problem)
  const usdtCursor = orders.find({
    currency: 'USDT',
    paymentMethod: 'paycrypto',
    amount: { $gt: 1000 }, // suspiciously high for USDT
  });
  let usdtFixed = 0;
  for await (const order of usdtCursor) {
    const oldAmount = order.amount;
    const newAmount = Math.round((oldAmount / EXCHANGE_RATE) * 100) / 100;
    console.log(
      `  [USDT] ${order.orderNumber || order._id}: $${oldAmount} → $${newAmount}`
    );
    await orders.updateOne({ _id: order._id }, { $set: { amount: newAmount } });
    usdtFixed++;
  }
  console.log(`Fixed ${usdtFixed} USDT orders.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

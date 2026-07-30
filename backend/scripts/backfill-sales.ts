/**
 * One-time script: backfill Product.sales and Product.revenue
 * from all orders that have product references.
 *
 * Usage: npx tsx scripts/backfill-sales.ts
 */
import mongoose from 'mongoose';
import Product from '../src/models/Product';

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zipremium';
  await mongoose.connect(mongoUri);
  console.log(`Connected to ${mongoUri.replace(/\/\/.*@/, '//<credentials>@')}`);

  // Reset all product sales/revenue to 0 first
  await Product.updateMany({}, { $set: { sales: 0, revenue: 0 } });
  console.log('Reset all product sales/revenue to 0');

  // Use the raw collection to see ALL orders
  const db = mongoose.connection.db!;
  const orders = await db.collection('orders').find({}).toArray();
  console.log(`Total orders in DB: ${orders.length}`);

  // Check what statuses exist
  const statuses = [...new Set(orders.map(o => o.paymentStatus || '(missing)'))];
  console.log(`Payment statuses found: ${statuses.join(', ')}`);

  // Aggregate sales per product
  const productMap: Record<string, { sales: number; revenue: number }> = {};

  for (const order of orders) {
    // Track product references from items array
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        const productId = item.product?.toString();
        if (!productId || productId.length !== 24 || !/^[a-f0-9]+$/i.test(productId)) continue;
        if (!productMap[productId]) productMap[productId] = { sales: 0, revenue: 0 };
        productMap[productId].sales += item.quantity || 1;
        productMap[productId].revenue += item.price || 0;
      }
    }

    // Also track from legacy root product field
    const legacyId = order.product?.toString();
    if (legacyId && legacyId.length === 24 && /^[a-f0-9]+$/i.test(legacyId)) {
      if (!productMap[legacyId]) productMap[legacyId] = { sales: 0, revenue: 0 };
      // Avoid double-counting if this order also has items
      if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
        productMap[legacyId].sales += order.quantity || 1;
        productMap[legacyId].revenue += order.amount || 0;
      }
    }
  }

  // Update each product
  const productIds = Object.keys(productMap);
  let updatedCount = 0;
  for (const id of productIds) {
    const { sales, revenue } = productMap[id];
    const result = await Product.findByIdAndUpdate(id, { $set: { sales, revenue } });
    if (result) updatedCount++;
  }

  console.log(`Updated ${updatedCount} out of ${productIds.length} referenced products with sales/revenue`);

  // Print the top 10 so we can verify
  const sorted = productIds
    .map(id => ({ id, ...productMap[id] }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);

  console.log('\nTop products by sales:');
  for (const p of sorted) {
    const prod = await Product.findById(p.id).select('name').lean();
    console.log(`  ${prod?.name || '???'}: ${p.sales} sales, $${p.revenue.toFixed(2)}`);
  }

  console.log('\nDone!');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});

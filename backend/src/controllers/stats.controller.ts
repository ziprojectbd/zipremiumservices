import Order from '@models/Order';
import Product from '@models/Product';
import Customer from '@models/Customer';
import connectDB from '@db/connect';
import { success } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import { roundCurrency } from '@utils/currency';

// GET /api/stats/dashboard
export const getDashboardStats = asyncHandler(async (req, res) => {
  await connectDB();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get top 5 products by lifetime sales
  const topProducts = await Product.find()
    .sort({ sales: -1 })
    .limit(5)
    .select('name imageUrl price priceBDT priceUSDT sales')
    .lean();
  const topProductIds = topProducts.map((p) => p._id);

  const [
    revenueResult,
    todayRevenueResult,
    totalOrders,
    totalProducts,
    totalCustomersResult,
    recentOrders,
    todayOrdersCount,
    monthlyDailyStats,
    productSalesAggregation,
  ] = await Promise.all([
    // Revenue aggregation grouped by currency (verified only)
    Order.aggregate([
      { $match: { paymentStatus: 'verified' } },
      {
        $group: {
          _id: '$currency',
          total: { $sum: '$amount' },
        },
      },
    ]),
    // Today's revenue (verified only)
    Order.aggregate([
      {
        $match: {
          paymentStatus: 'verified',
          createdAt: { $gte: startOfToday },
        },
      },
      {
        $group: {
          _id: '$currency',
          total: { $sum: '$amount' },
        },
      },
    ]),
    // Total orders count
    Order.countDocuments(),
    // Total products count
    Product.countDocuments(),
    // Total customers (distinct email from orders)
    Order.distinct('email'),
    // Recent 5 orders
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    // Today's orders count
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    // Monthly daily stats (current month, grouped by day + currency)
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          paymentStatus: 'verified',
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$createdAt' },
            currency: '$currency',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]),
    // Product sales in current and previous periods (for top products)
    Order.aggregate([
      {
        $match: {
          paymentStatus: 'verified',
          createdAt: { $gte: sixtyDaysAgo },
          'items.product': { $in: topProductIds },
        },
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.product': { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            productId: '$items.product',
            period: {
              $cond: [
                { $gte: ['$createdAt', thirtyDaysAgo] },
                'current',
                'previous',
              ],
            },
          },
          unitsSold: { $sum: '$items.quantity' },
        },
      },
    ]),
  ]);

  // Build revenue maps
  const revenueMap: Record<string, number> = {};
  const todayRevenueMap: Record<string, number> = {};
  for (const r of revenueResult) {
    revenueMap[r._id as string] = r.total;
  }
  for (const r of todayRevenueResult) {
    todayRevenueMap[r._id as string] = r.total;
  }

  const totalCustomers = totalCustomersResult.length;

  // Build today's revenue strings
  const todayUsdt = todayRevenueMap.USDT || 0;
  const todayBdt = todayRevenueMap.BDT || 0;

  // Map product sales by period: productId -> { current: number, previous: number }
  const productSalesMap = new Map<
    string,
    { current: number; previous: number }
  >();
  for (const result of productSalesAggregation) {
    const productId = result._id.productId.toString();
    const period = result._id.period;
    const unitsSold = result.unitsSold;
    if (!productSalesMap.has(productId)) {
      productSalesMap.set(productId, { current: 0, previous: 0 });
    }
    const sales = productSalesMap.get(productId)!;
    if (period === 'current') {
      sales.current = unitsSold;
    } else {
      sales.previous = unitsSold;
    }
  }

  // Enhance top products with period sales, growth, and display price
  const enhancedTopProducts = topProducts.map((product) => {
    const salesData = productSalesMap.get(product._id.toString()) || {
      current: 0,
      previous: 0,
    };
    const { current, previous } = salesData;
    let growthPercentage = 'N/A';
    if (previous > 0) {
      const growth = ((current - previous) / previous) * 100;
      growthPercentage = `${growth.toFixed(0)}%`;
    } else if (current > 0) {
      growthPercentage = 'New';
    }

    // Determine display price and currency
    let displayPrice = 0;
    let displayCurrency = 'USDT';
    if (product.priceBDT > 0) {
      displayPrice = product.priceBDT;
      displayCurrency = 'BDT';
    } else {
      displayPrice = product.price;
      displayCurrency = 'USDT';
    }

    return {
      ...product,
      currentPeriodSales: current,
      previousPeriodSales: previous,
      growthPercentage,
      displayPrice,
      displayCurrency,
    };
  });

  const stats = [
    {
      title: 'Revenue USDT',
      value: roundCurrency(revenueMap.USDT || 0, 2).toFixed(2),
      change: `+${todayUsdt > 0 ? roundCurrency((todayUsdt / (revenueMap.USDT || 1)) * 100, 0).toFixed(0) : '0'}%`,
      icon: 'DollarSign',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Revenue BDT',
      value: roundCurrency(revenueMap.BDT || 0, 2).toFixed(2),
      change: `+${todayBdt > 0 ? roundCurrency((todayBdt / (revenueMap.BDT || 1)) * 100, 0).toFixed(0) : '0'}%`,
      icon: 'BangladeshiTakaIcon',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      change: '+0%',
      icon: 'ShoppingCart',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Products',
      value: totalProducts.toString(),
      change: '+0%',
      icon: 'Package',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Total Customers',
      value: totalCustomers.toString(),
      change: '+0%',
      icon: 'Users',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: "Today's Orders",
      value: todayOrdersCount.toString(),
      change: `+${todayUsdt > 0 || todayBdt > 0 ? '!' : '0'}`,
      sub: todayUsdt > 0 || todayBdt > 0 ? `$${roundCurrency(todayUsdt, 2).toFixed(2)} / \u09F3${roundCurrency(todayBdt, 2).toFixed(2)}` : '',
      icon: 'ShoppingCart',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return res.json(
    success({
      stats,
      recentOrders,
      topProducts: enhancedTopProducts,
      monthlyDailyStats,
    })
  );
});

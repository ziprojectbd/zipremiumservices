import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import connectDB from '../db/connect.js';
import { success } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { roundCurrency } from '../utils/currency.js';

// GET /api/stats/dashboard
export const getDashboardStats = asyncHandler(async (req, res) => {
  await connectDB();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    revenueResult,
    todayRevenueResult,
    totalOrders,
    totalProducts,
    totalCustomersResult,
    recentOrders,
    topProducts,
    todayOrdersCount,
    monthlyDailyStats,
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
    // Top products by sales count
    Product.find()
      .sort({ sales: -1 })
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
  ]);

  // Build revenue maps
  const revenueMap = {};
  const todayRevenueMap = {};
  for (const r of revenueResult) {
    revenueMap[r._id] = r.total;
  }
  for (const r of todayRevenueResult) {
    todayRevenueMap[r._id] = r.total;
  }

  const totalCustomers = totalCustomersResult.length;

  // Build today's revenue strings
  const todayUsdt = todayRevenueMap.USDT || 0;
  const todayBdt = todayRevenueMap.BDT || 0;

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
      sub: todayUsdt > 0 || todayBdt > 0 ? `$${roundCurrency(todayUsdt, 2).toFixed(2)} / ৳${roundCurrency(todayBdt, 2).toFixed(2)}` : '',
      icon: 'ShoppingCart',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return res.json(
    success({
      stats,
      recentOrders,
      topProducts,
      monthlyDailyStats,
    })
  );
});

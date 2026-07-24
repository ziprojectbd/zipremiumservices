import mongoose from 'mongoose';
import connectDB from '../db/connect.js';
import { success, error, paginated } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SmmSettings from '../models/SmmSettings.js';

// GET /products - List products
export const getProducts = asyncHandler(async (req, res) => {
  await connectDB();

  const { category, featured, search, page: pageParam, limit: limitParam } = req.query;

  const page = Math.max(1, parseInt(pageParam, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 50));
  const skip = (page - 1) * limit;

  // Fetch SmmSettings to know which SMM categories are enabled
  const smmSettings = await SmmSettings.findOne().lean();
  const enabledCategories = smmSettings?.enabledCategories || [];

  // Check whether custom categories exist in the DB
  const categoryCount = await Category.countDocuments();

  const filter = {};

  if (category) {
    // Specific category requested — also check if it's an SMM category that's disabled
    filter.category = category;
  }

  // Always restrict oneservicebd SMM products to enabled platforms only.
  // Non-SMM products and products from other providers are unaffected.
  filter.$or = [
    { smmProvider: { $ne: 'oneservicebd' } },
    { smmProvider: 'oneservicebd', category: { $in: enabledCategories } },
  ];

  if (featured === 'true') {
    filter.featured = true;
  }

  if (search && search.trim()) {
    filter.name = { $regex: search.trim(), $options: 'i' };
  }

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  return res.json({
    ...paginated(products, total, page, limit),
    count: products.length,
  });
});

// GET /products/:id - Get product by ID or seoSlug
export const getProductById = asyncHandler(async (req, res) => {
  await connectDB();

  const { id } = req.params;

  let product;

  // Try by MongoDB ObjectId first
  if (mongoose.Types.ObjectId.isValid(id)) {
    product = await Product.findById(id).lean();
  }

  // Fall back to seoSlug match
  if (!product) {
    product = await Product.findOne({ seoSlug: id }).lean();
  }

  if (!product) {
    return res.status(404).json(error('Product not found'));
  }

  // If product has no orderFields, try injecting from SmmSettings
  if ((!product.orderFields || product.orderFields.length === 0) && product.category) {
    try {
      const smmSettings = await SmmSettings.findOne().lean();
      const catFields = smmSettings?.categoryOrderFields?.[product.category];
      if (catFields && Array.isArray(catFields) && catFields.length > 0) {
        product.orderFields = catFields;
      }
    } catch {
      // Non-blocking — leave orderFields empty
    }
  }

  // Final fallback: hardcoded Website Traffic fields (overrides stale DB data)
  if (product.category === 'Website Traffic' && product.smmServiceId !== '8629') {
    product.orderFields = [
      { key: 'link', label: 'Website Link', type: 'url', required: true, placeholder: 'https://' },
      { key: 'country', label: 'Country', type: 'text', required: true, placeholder: 'e.g. Bangladesh' },
      { key: 'device', label: 'ডিভাইস', type: 'radio', required: true, options: [
        { label: 'ডেস্কটপ', value: 'desktop' },
        { label: 'মোবাইল (অ্যান্ড্রয়েড)', value: 'android' },
        { label: 'মোবাইল (iPhone/iOS)', value: 'ios' },
        { label: 'মিশ্র (মোবাইল)', value: 'mixed_mobile' },
        { label: 'মিশ্র (মোবাইল ও ডেস্কটপ)', value: 'mixed_all' },
      ]},
      { key: 'trafficType', label: 'ট্রাফিকের ধরন', type: 'radio', required: true, options: [
        { label: 'Google কীওয়ার্ড', value: 'google_keyword' },
        { label: 'কাস্টম রেফারার', value: 'custom_referrer' },
        { label: 'রেফার ছাড়া', value: 'no_referrer' },
      ]},
      { key: 'keyword', label: 'Google কীওয়ার্ড', type: 'text', required: true, placeholder: 'Google Keyword...', showIf: { field: 'trafficType', equals: 'google_keyword' } },
      { key: 'referrerUrl', label: 'Referrer URL', type: 'url', required: true, placeholder: 'https://', showIf: { field: 'trafficType', equals: 'custom_referrer' } },
    ];
  }

  return res.json(success(product));
});

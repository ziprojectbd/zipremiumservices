import mongoose from 'mongoose';
import connectDB from '@db/connect';
import { success, error, paginated } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import Product from '@models/Product';
import Category from '@models/Category';
import SmmSettings from '@models/SmmSettings';

// GET /products - List products
export const getProducts = asyncHandler(async (req, res) => {
  await connectDB();

  const { category, featured, search, page: pageParam, limit: limitParam } = req.query;

  const page = Math.max(1, parseInt(pageParam as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitParam as string, 10) || 50));
  const skip = (page - 1) * limit;

  // Fetch SmmSettings to know which SMM categories are enabled
  const smmSettings = await SmmSettings.findOne().lean();
  const enabledCategories = (smmSettings?.enabledCategories as string[]) || [];

  // Check whether custom categories exist in the DB
  await Category.countDocuments();

  const filter: Record<string, unknown> = {};

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

  if (search && (search as string).trim()) {
    filter.name = { $regex: (search as string).trim(), $options: 'i' };
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

  const id = req.params.id as string;

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
  if ((!product.orderFields || (product.orderFields as unknown[])?.length === 0) && product.category) {
    try {
      const smmSettings = await SmmSettings.findOne().lean();
      const catFields = (smmSettings?.categoryOrderFields as Record<string, unknown>)?.[product.category as string];
      if (catFields && Array.isArray(catFields) && catFields.length > 0) {
        (product as Record<string, unknown>).orderFields = catFields;
      }
    } catch {
      // Non-blocking — leave orderFields empty
    }
  }

  // Final fallback: hardcoded Website Traffic fields (overrides stale DB data)
  if (product.category === 'Website Traffic' && product.smmServiceId !== '8629') {
    (product as Record<string, unknown>).orderFields = [
      { key: 'link', label: 'Website Link', type: 'url', required: true, placeholder: 'https://' },
      { key: 'country', label: 'Country', type: 'text', required: true, placeholder: 'e.g. Bangladesh' },
      { key: 'device', label: '\u09A1\u09BF\u09AD\u09BE\u0987\u09B8', type: 'radio', required: true, options: [
        { label: '\u09A1\u09C7\u09B8\u09CD\u0995\u099F\u09AA', value: 'desktop' },
        { label: '\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 (\u098F\u09A8\u09CD\u09A1\u09CD\u09B0\u09AF\u09BC\u09BF\u09A1)', value: 'android' },
        { label: '\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 (iPhone/iOS)', value: 'ios' },
        { label: '\u09AE\u09BF\u09B6\u09CD\u09B0 (\u09AE\u09CB\u09AC\u09BE\u0987\u09B2)', value: 'mixed_mobile' },
        { label: '\u09AE\u09BF\u09B6\u09CD\u09B0 (\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u0993 \u09A1\u09C7\u09B8\u09CD\u0995\u099F\u09AA)', value: 'mixed_all' },
      ]},
      { key: 'trafficType', label: '\u099F\u09CD\u09B0\u09BE\u09AB\u09BF\u0995\u09C7\u09B0 \u09A7\u09B0\u09A8', type: 'radio', required: true, options: [
        { label: 'Google \u0995\u09C0\u0989\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1', value: 'google_keyword' },
        { label: '\u0995\u09BE\u09B8\u09CD\u099F\u09AE \u09B0\u09BF\u09AB\u09BE\u09B0\u09BE\u09B0', value: 'custom_referrer' },
        { label: '\u09B0\u09BF\u09AB\u09BE\u09B0 \u099B\u09BE\u09A1\u09BC\u09BE', value: 'no_referrer' },
      ]},
      { key: 'keyword', label: 'Google \u0995\u09C0\u0989\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1', type: 'text', required: true, placeholder: 'Google Keyword...', showIf: { field: 'trafficType', equals: 'google_keyword' } },
      { key: 'referrerUrl', label: 'Referrer URL', type: 'url', required: true, placeholder: 'https://', showIf: { field: 'trafficType', equals: 'custom_referrer' } },
    ];
  }

  return res.json(success(product));
});

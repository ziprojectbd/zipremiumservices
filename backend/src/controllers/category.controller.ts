import connectDB from '@db/connect';
import { success } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import Category from '@models/Category';
import Product from '@models/Product';
import { getEnabledSmmCategories, isProductVisible } from '@utils/productVisibility';

// GET /categories - List categories
//
// The chip list is derived from the products a customer can actually browse, so
// a chip can never advertise a count the product list cannot deliver. Counts
// come from the same set (previously they counted every product, including SMM
// products hidden by the storefront filter, which made a chip disagree with its
// own listing).
export const getCategories = asyncHandler(async (_req, res) => {
  await connectDB();

  const enabledCategories = await getEnabledSmmCategories();

  const dbCategories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Only the fields needed to decide visibility and count.
  const allProducts = await Product.find({}, { category: 1, smmProvider: 1 }).lean();

  // Count only the products the storefront lists.
  const countMap: Record<string, number> = {};
  const visible = allProducts.filter((p) => isProductVisible(p, enabledCategories));
  for (const product of visible) {
    const catName = String(product.category || '').trim();
    if (!catName) continue;
    countMap[catName] = (countMap[catName] || 0) + 1;
  }

  const totalCount = visible.length;

  // Category documents that have at least one visible product.
  const docChips = dbCategories.filter((cat) => (countMap[String(cat.name)] || 0) > 0);

  // Enabled SMM platforms get a virtual chip when they have visible products and
  // no Category document already covers them.
  const covered = new Set(docChips.map((c) => String(c.name).toLowerCase()));
  const virtualChips = enabledCategories
    .filter((platform) => !covered.has(String(platform).toLowerCase()))
    .filter((platform) => (countMap[platform] || 0) > 0)
    .map((platform) => ({
      name: platform,
      slug: String(platform).toLowerCase().replace(/\s+/g, '-'),
      icon: '\u{1F4F1}',
      gradient: 'from-purple-500 to-indigo-500',
      isActive: true,
      sortOrder: 99,
      _virtual: true,
    }));

  const categoriesWithCount = [...docChips, ...virtualChips].map((cat) => ({
    ...cat,
    count: countMap[String(cat.name)] || 0,
  }));

  const allCategory = {
    name: 'All',
    slug: 'all',
    icon: '\u{1F4E6}',
    gradient: 'from-gray-500 to-slate-500',
    isActive: true,
    sortOrder: -1,
    count: totalCount,
  };

  return res.json(success([allCategory, ...categoriesWithCount]));
});

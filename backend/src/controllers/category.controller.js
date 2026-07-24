import connectDB from '../db/connect.js';
import { success, error, paginated } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import SmmSettings from '../models/SmmSettings.js';

// GET /categories - List categories
export const getCategories = asyncHandler(async (req, res) => {
  await connectDB();

  // Fetch SmmSettings for enabled SMM categories
  const smmSettings = await SmmSettings.findOne().lean();
  const enabledCategories = smmSettings?.enabledCategories || [];

  // Fetch active categories sorted
  const dbCategories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Fetch ALL products (only the category field to minimise data transfer)
  const allProducts = await Product.find({}, { category: 1 }).lean();

  // Build count map: category name -> product count
  const countMap = {};
  for (const product of allProducts) {
    const catName = product.category;
    countMap[catName] = (countMap[catName] || 0) + 1;
  }

  const totalCount = allProducts.length;

  // Build set of category names already covered by the Category collection
  const dbCatNames = new Set(dbCategories.map((c) => c.name.toLowerCase()));

  // Inject virtual category entries for enabled SMM platforms that don't have a Category doc
  for (const platform of enabledCategories) {
    if (!dbCatNames.has(platform.toLowerCase())) {
      dbCategories.push({
        name: platform,
        slug: platform.toLowerCase().replace(/\s+/g, '-'),
        icon: '📱',
        gradient: 'from-purple-500 to-indigo-500',
        isActive: true,
        sortOrder: 99,
        _virtual: true,
      });
    }
  }

  // Filter out categories with zero products
  const filteredCategories = dbCategories.filter((cat) => {
    const count = countMap[cat.name] || 0;
    return count > 0;
  });

  // Attach product counts
  const categoriesWithCount = filteredCategories.map((cat) => ({
    ...cat,
    count: countMap[cat.name] || 0,
  }));

  // Prepend "All" category
  const allCategory = {
    name: 'All',
    slug: 'all',
    icon: '📦',
    gradient: 'from-gray-500 to-slate-500',
    isActive: true,
    sortOrder: -1,
    count: totalCount,
  };

  return res.json(success([allCategory, ...categoriesWithCount]));
});

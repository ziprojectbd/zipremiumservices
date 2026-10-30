import connectDB from '@db/connect';
import { success } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import { buildCategoryChips } from '@utils/productVisibility';

// GET /categories - List categories
//
// The chip list is derived from the products a customer can actually browse, so
// a chip can never advertise a count the product list cannot deliver. The chips
// (with their icon and gradient) come from the same builder the admin filter row
// uses, so both look identical.
export const getCategories = asyncHandler(async (_req, res) => {
  await connectDB();

  const { all, chips } = await buildCategoryChips();

  // A storefront chip is only useful when it has something to show.
  const visible = chips.filter((chip) => chip.count > 0);

  return res.json(success([all, ...visible]));
});

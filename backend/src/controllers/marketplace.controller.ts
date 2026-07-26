import DigitalAssetListing from '@models/DigitalAssetListing';
import connectDB from '@db/connect';
import { success, error, paginated } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';

// GET /api/marketplace/listings
export const getListings = asyncHandler(async (req, res) => {
  await connectDB();

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  if (req.query.category) {
    query.assetType = req.query.category;
  }
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  if (req.query.status) {
    query.status = req.query.status;
  } else {
    query.status = 'active';
  }

  const [data, total] = await Promise.all([
    DigitalAssetListing.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DigitalAssetListing.countDocuments(query),
  ]);

  return res.json(paginated(data, total, page, limit));
});

// POST /api/marketplace/listings
export const createListing = asyncHandler(async (req, res) => {
  await connectDB();

  const {
    traderEmail,
    traderName,
    assetType,
    title,
    description,
    price,
    negotiable,
    images,
  } = req.body;

  if (!traderEmail || !traderName || !assetType || !title || price === undefined) {
    return res.status(400).json(error('traderEmail, traderName, assetType, title, and price are required'));
  }

  const listing = await DigitalAssetListing.create({
    traderEmail,
    traderName,
    assetType,
    title,
    description,
    price,
    negotiable,
    images,
    ...req.body,
  });

  return res.status(201).json(success(listing, 'Listing created'));
});

// PUT /api/marketplace/listings/:id
export const updateListing = asyncHandler(async (req, res) => {
  await connectDB();

  const listing = await DigitalAssetListing.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!listing) {
    return res.status(404).json(error('Listing not found'));
  }

  return res.json(success(listing, 'Listing updated'));
});

// DELETE /api/marketplace/listings/:id
export const deleteListing = asyncHandler(async (req, res) => {
  await connectDB();

  const listing = await DigitalAssetListing.findByIdAndDelete(req.params.id);

  if (!listing) {
    return res.status(404).json(error('Listing not found'));
  }

  return res.json(success(null, 'Listing deleted'));
});

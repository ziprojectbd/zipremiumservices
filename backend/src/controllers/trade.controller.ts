import Trader from '@models/Trader';
import TraderBid from '@models/TraderBid';
import TraderOrder from '@models/TraderOrder';
import TraderSession from '@models/TraderSession';
import connectDB from '@db/connect';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';

// GET /api/trade/settings
export const getTradeSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const traders = await Trader.find().sort({ createdAt: -1 }).lean();
  const bids = await TraderBid.find().sort({ createdAt: -1 }).lean();
  const orders = await TraderOrder.find().sort({ createdAt: -1 }).lean();

  return res.json(
    success({
      traders,
      bids,
      orders,
    })
  );
});

// PUT /api/trade/settings
export const updateTradeSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const { traderId, status } = req.body;

  if (traderId && status) {
    const trader = await Trader.findByIdAndUpdate(
      traderId,
      { status },
      { new: true, runValidators: true }
    );

    if (!trader) {
      return res.status(404).json(error('Trader not found'));
    }

    return res.json(success(trader, 'Trade settings updated'));
  }

  return res.status(400).json(error('traderId and status are required'));
});

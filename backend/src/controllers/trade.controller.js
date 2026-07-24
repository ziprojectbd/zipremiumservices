import Trader from '../models/Trader.js';
import TraderBid from '../models/TraderBid.js';
import TraderOrder from '../models/TraderOrder.js';
import TraderSession from '../models/TraderSession.js';
import connectDB from '../db/connect.js';
import { success, error } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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

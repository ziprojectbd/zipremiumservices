import PaymentSettings from '../models/PaymentSettings.js';
import connectDB from '../db/connect.js';
import { success, error } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { roundCurrency } from '../utils/currency.js';

// GET /convert-price?amount=100&from=BDT&to=USD
export const convertPrice = asyncHandler(async (req, res) => {
  await connectDB();

  const amount = parseFloat(req.query.amount) || 0;
  const from = (req.query.from || 'BDT').toUpperCase();
  const to = (req.query.to || 'USD').toUpperCase();

  const paymentSettings = await PaymentSettings.findOne();
  const exchangeRate = paymentSettings?.exchangeRate || 110;

  let convertedAmount;
  if (from === 'BDT' && to === 'USD') {
    convertedAmount = roundCurrency(amount / exchangeRate);
  } else if (from === 'USD' && to === 'BDT') {
    convertedAmount = roundCurrency(amount * exchangeRate);
  } else {
    convertedAmount = amount;
  }

  return res.json(success({
    originalAmount: amount,
    from,
    to,
    convertedAmount: convertedAmount.toFixed(2),
    exchangeRate,
  }));
});

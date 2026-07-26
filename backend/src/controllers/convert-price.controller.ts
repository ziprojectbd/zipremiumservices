import PaymentSettings from '@models/PaymentSettings';
import connectDB from '@db/connect';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import { roundCurrency } from '@utils/currency';

// GET /convert-price?amount=100&from=BDT&to=USD
export const convertPrice = asyncHandler(async (req, res) => {
  await connectDB();

  const amount = parseFloat(req.query.amount as string) || 0;
  const from = ((req.query.from as string) || 'BDT').toUpperCase();
  const to = ((req.query.to as string) || 'USD').toUpperCase();

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

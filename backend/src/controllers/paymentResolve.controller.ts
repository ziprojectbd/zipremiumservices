import axios from 'axios';
import env from '@config/env';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';

/**
 * Resolve a ZI-Pay one-time payment result server-to-server.
 *
 * The gateway mints a PaymentResult at invoice-submit time and returns the
 * customer to /payment/process with only `resultId` + `token` in the URL.
 * The browser never carries payment data (provider/amount/trxId/...). This
 * endpoint forwards the resultId + token to the gateway backend, which
 * verifies the SHA-256 token and atomically consumes the record (one-time
 * use). The returned values are gateway-authoritative.
 *
 * POST /api/v1/payment-resolve
 * Body: { resultId, token }
 */
export const resolvePayment = asyncHandler(async (req, res) => {
  const resultId = String(req.body?.resultId || '').trim();
  const token = String(req.body?.token || '').trim();

  if (!resultId || !token) {
    return res.status(400).json(error('Missing resultId or token'));
  }

  const gatewayBase = (env.ZIPAY_URL || 'https://pay.zipremiumservices.com').replace(/\/+$/, '');

  let gatewayRes;
  try {
    gatewayRes = await axios.get(
      `${gatewayBase}/api/v1/payment-results/${encodeURIComponent(resultId)}`,
      {
        params: { token },
        timeout: 15000,
        headers: { Accept: 'application/json' },
      }
    );
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      return res
        .status(400)
        .json(error('Payment result not found or already used. Please go back and try again.'));
    }
    return res.status(502).json(error('Could not confirm payment with the gateway. Please try again.'));
  }

  const data = gatewayRes?.data?.data;
  if (!gatewayRes || !data) {
    return res.status(502).json(error('Invalid response from the payment gateway.'));
  }

  // Gateway-authoritative payment data — surfaced to the client so the order
  // is created with exactly the provider/amount/trxId the gateway recorded.
  return res.json(
    success({
      provider: String(data.provider || ''),
      amount: Number(data.amount) || 0,
      currency: String(data.currency || 'BDT'),
      orderId: String(data.orderId || ''),
      payerNumber: String(data.payerDetails?.payerNumber || ''),
      trxId: String(data.payerDetails?.trxId || ''),
      merchantName: String(data.payerDetails?.merchantName || ''),
    })
  );
});

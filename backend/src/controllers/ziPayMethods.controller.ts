/**
 * ZiPay payment methods proxy.
 *
 * Fetches the list of enabled payment methods from the ZiPay gateway's public
 * providers endpoint. The gateway is the authoritative source for which payment
 * methods are available — the main website never hardcodes provider names, IDs,
 * codes, or logos. Gateway secrets and credentials never leave the server.
 */

import axios from 'axios';
import env from '@config/env';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';

// In-memory cache for payment methods (TTL 5 minutes)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export const getPaymentMethods = asyncHandler(async (_req, res) => {
  const gatewayUrl = env.ZIPAY_URL;
  if (!gatewayUrl) {
    return res.status(500).json(error('ZiPay gateway URL not configured'));
  }

  // Return cached result if still fresh
  const cached = cache.get('payment-methods');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(success(cached.data));
  }

  try {
    const response = await axios.get(`${gatewayUrl.replace(/\/$/, '')}/api/public/providers`, {
      timeout: 10000,
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.data?.data ?? response.data;

    // Normalize: ensure each method has code, name, displayName, icon, isActive
    const methods = Array.isArray(data)
      ? data.map((m: Record<string, unknown>) => ({
          code: String(m.code || m.id || ''),
          name: String(m.name || m.displayName || ''),
          displayName: String(m.displayName || m.name || ''),
          icon: String(m.icon || m.logo || m.imageUrl || ''),
          isActive: m.isActive !== false,
          qrImageUrl: String(m.qrImageUrl || m.qr_image_url || ''),
          accountNumber: String(m.accountNumber || m.account_no || ''),
        }))
      : [];

    // Cache the result
    cache.set('payment-methods', { data: methods, timestamp: Date.now() });

    return res.json(success(methods));
  } catch (err: any) {
    const status = err?.response?.status || 502;
    const message = err?.response?.data?.message || err?.message || 'Failed to fetch payment methods';
    return res.status(status).json(error(message));
  }
});

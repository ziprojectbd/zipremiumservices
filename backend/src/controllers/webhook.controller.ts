import CaptchaOrder from '@models/CaptchaOrder';
import CaptchaPackage from '@models/CaptchaPackage';
import env from '@config/env';
import connectDB from '@db/connect';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';

// POST /api/webhook/captchamaster
export const captchaMasterWebhook = asyncHandler(async (req, res) => {
  await connectDB();

  // Validate API key
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  if (!apiKey || apiKey !== env.CAPTCHAMASTER_API_KEY) {
    return res.status(401).json(error('Invalid or missing API key'));
  }

  const payload = req.body;

  if (!payload || !payload.event) {
    return res.status(400).json(error('Invalid webhook payload'));
  }

  const { event, orderId, packageId, customerEmail, planId, status, credits } = payload;

  switch (event) {
    case 'order.completed': {
      // Update captcha order status
      if (orderId) {
        await CaptchaOrder.findOneAndUpdate(
          { captchaMasterOrderId: orderId },
          {
            status: 'completed',
            captchaMasterPackageId: packageId,
            completedAt: new Date(),
          }
        );
      }

      // Create or activate the captcha package
      if (customerEmail && planId) {
        await CaptchaPackage.findOneAndUpdate(
          { customerEmail, planId, status: 'active' },
          {
            $setOnInsert: {
              customerEmail,
              planId,
              planName: payload.planName || '',
              credits: credits || 0,
              creditsRemaining: credits || 0,
              price: payload.price || 0,
              currency: payload.currency || 'USD',
              captchaMasterPackageId: packageId,
              captchaMasterOrderId: orderId,
              captchaApiKey: payload.apiKey || null,
              status: 'active',
              activatedAt: new Date(),
              expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
            },
          },
          { upsert: true, new: true }
        );
      }
      break;
    }

    case 'order.failed': {
      if (orderId) {
        await CaptchaOrder.findOneAndUpdate(
          { captchaMasterOrderId: orderId },
          { status: 'failed' }
        );
      }
      break;
    }

    case 'package.expired': {
      // Suspend the package
      if (customerEmail && planId) {
        await CaptchaPackage.findOneAndUpdate(
          { customerEmail, planId, status: 'active' },
          { status: 'expired' }
        );
      }
      break;
    }

    case 'credits.updated': {
      // Update credits for a package
      if (customerEmail && planId && credits !== undefined) {
        await CaptchaPackage.findOneAndUpdate(
          { customerEmail, planId, status: 'active' },
          {
            creditsUsed: payload.creditsUsed || 0,
            creditsRemaining: credits,
          }
        );
      }
      break;
    }

    default:
      // Unknown event — acknowledge receipt but log nothing
      break;
  }

  return res.json(success({ received: true }));
});

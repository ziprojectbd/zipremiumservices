import PromoOffer from '@models/PromoOffer';
import PromoMarqueeSettings from '@models/PromoMarqueeSettings';
import MaintenanceSettings from '@models/MaintenanceSettings';
import Footer from '@models/Footer';
import SideSliderSettings from '@models/SideSliderSettings';
import PopupManagement from '@models/PopupManagement';
import PopupSettings from '@models/PopupSettings';
import PaymentSettings from '@models/PaymentSettings';
import Order from '@models/Order';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import { getGeoFromIP, countryCodeToFlag } from '@utils/geo';

/** Shown when an order has no resolvable country. */
const GLOBE_FLAG = '\u{1F310}';

/** Loopback / private addresses have no country. */
function isLocalIp(ip: string): boolean {
  const v = String(ip || '').trim();
  if (!v) return true;
  return (
    v === '127.0.0.1' ||
    v === '::1' ||
    v === 'localhost' ||
    v === '::ffff:127.0.0.1' ||
    v.startsWith('192.168.') ||
    v.startsWith('10.') ||
    v.startsWith('172.16.') ||
    v.startsWith('::ffff:127.') ||
    v.includes('127.0.0.1')
  );
}

// GET /public/promo-offers
export const getPromoOffers = asyncHandler(async (req, res) => {
  try {
    const offers = await PromoOffer.find({ enabled: true }).sort({ order: 1 });
    return res.json(success(offers));
  } catch (err) {
    return res.json(success([]));
  }
});

// GET /public/promo-marquee
export const getPromoMarquee = asyncHandler(async (req, res) => {
  try {
    const settings = await PromoMarqueeSettings.getSettings();
    return res.json(success({ enabled: settings.enabled, message: settings.message }));
  } catch (err) {
    return res.json(success({ enabled: true, message: '' }));
  }
});

// GET /public/recent-orders
export const getRecentOrders = asyncHandler(async (req, res) => {
  try {
    let limit = parseInt(req.query.limit as string, 10) || 10;
    if (limit < 1) limit = 1;
    if (limit > 50) limit = 50;

    const orders = await Order.find({ status: { $in: ['approved', 'delivered'] } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Country is taken from the IP captured when the order was created, so the
    // flag reflects where the customer actually ordered from. IPs that have no
    // stored country yet are resolved on demand (cached) rather than faking a
    // flag, and everything else falls back to the globe emoji.
    const missingGeo = orders.filter(
      (o: any) => !o.countryCode && o.ipAddress && !isLocalIp(o.ipAddress),
    );

    const resolved = new Map<string, string>();
    await Promise.all(
      missingGeo.slice(0, 10).map(async (o: any) => {
        try {
          const geo = await getGeoFromIP(o.ipAddress);
          if (geo.countryCode) resolved.set(o.ipAddress, geo.countryCode);
        } catch {
          // Non-fatal: the order still renders with the fallback flag.
        }
      }),
    );

    const activities = orders.map((order: any) => {
      const rawName = order.username || order.email || 'Anonymous';
      const truncatedUsername =
        rawName.length > 4 ? rawName.substring(0, 4) + '...' : rawName;

      const createdAt = order.createdAt;
      let timeAgo = 'Just now';
      if (createdAt) {
        const diffMs = Date.now() - new Date(createdAt).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) timeAgo = 'Just now';
        else if (diffMins < 60) timeAgo = `${diffMins} min ago`;
        else if (diffMins < 1440) timeAgo = `${Math.floor(diffMins / 60)}h ago`;
        else timeAgo = '';
      }

      const code =
        order.countryCode || (order.ipAddress ? resolved.get(order.ipAddress) : '') || '';
      const flag = order.countryFlag || countryCodeToFlag(code) || GLOBE_FLAG;

      return {
        flag,
        country: order.country || '',
        countryCode: code,
        user: truncatedUsername,
        service: order.productName || order.items?.[0]?.productName || 'Service',
        time: timeAgo,
      };
    });

    return res.json(success(activities));
  } catch (err) {
    return res.json(success([]));
  }
});

// GET /public/footer
export const getFooter = asyncHandler(async (req, res) => {
  try {
    const data = await Footer.findOne();
    return res.json(success(data || {}));
  } catch (err) {
    return res.json(success({}));
  }
});

// GET /public/side-slider
export const getSideSlider = asyncHandler(async (req, res) => {
  try {
    const data = await SideSliderSettings.findOne();
    return res.json(success(data || {}));
  } catch (err) {
    return res.json(success({}));
  }
});

// GET /public/maintenance
export const getMaintenance = asyncHandler(async (req, res) => {
  try {
    const data = await MaintenanceSettings.findOne();
    if (data) {
      return res.json(success(data));
    }
    return res.json(success({ enabled: false, type: 'marquee' }));
  } catch (err) {
    return res.json(success({ enabled: false, type: 'marquee' }));
  }
});

// GET /public/popup-images
export const getPopupImages = asyncHandler(async (req, res) => {
  try {
    const images = await PopupManagement.find({}).sort({ createdAt: -1 });
    return res.json(success(images));
  } catch (err) {
    return res.json(success([]));
  }
});

// GET /public/popup-settings
export const getPopupSettings = asyncHandler(async (req, res) => {
  try {
    const data = await PopupSettings.findOne();
    return res.json(success(data || { enabled: true }));
  } catch (err) {
    return res.json(success({ enabled: true }));
  }
});

// GET /public/payment-settings
export const getPaymentSettings = asyncHandler(async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne().lean();
    if (!settings) {
      settings = {};
    }
    return res.json(success(settings));
  } catch (err) {
    return res.json(success({}));
  }
});

// GET /public/settings — combined endpoint returning all public settings in one call
export const getAllPublicSettings = asyncHandler(async (req, res) => {
  try {
    const [footerData, marqueeData, sliderData, paymentData, maintenanceData] = await Promise.all([
      Footer.findOne().catch(() => null),
      PromoMarqueeSettings.getSettings().catch(() => null),
      SideSliderSettings.findOne().catch(() => null),
      PaymentSettings.findOne().lean().catch(() => null),
      MaintenanceSettings.findOne().catch(() => null),
    ]);

    return res.json(success({
      footer: footerData || {},
      promoMarquee: marqueeData ? { enabled: marqueeData.enabled, message: marqueeData.message } : { enabled: true, message: '' },
      sideSlider: sliderData || {},
      paymentSettings: paymentData || {},
      maintenance: maintenanceData || { enabled: false, type: 'marquee' },
    }));
  } catch (err) {
    return res.json(success({
      footer: {},
      promoMarquee: { enabled: true, message: '' },
      sideSlider: {},
      paymentSettings: {},
      maintenance: { enabled: false, type: 'marquee' },
    }));
  }
});

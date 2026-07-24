import PromoOffer from '../models/PromoOffer.js';
import PromoMarqueeSettings from '../models/PromoMarqueeSettings.js';
import MaintenanceSettings from '../models/MaintenanceSettings.js';
import Footer from '../models/Footer.js';
import SideSliderSettings from '../models/SideSliderSettings.js';
import PopupManagement from '../models/PopupManagement.js';
import PopupSettings from '../models/PopupSettings.js';
import PaymentSettings from '../models/PaymentSettings.js';
import Order from '../models/Order.js';
import { success, error } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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
    let limit = parseInt(req.query.limit, 10) || 10;
    if (limit < 1) limit = 1;
    if (limit > 50) limit = 50;

    const orders = await Order.find({ status: { $in: ['approved', 'delivered'] } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const flags = ['🇧🇩', '🇺🇸', '🇬🇧', '🇦🇪', '🇸🇦', '🇮🇳', '🇵🇰', '🇲🇾', '🇸🇬', '🇨🇦'];

    const activities = orders.map((order, index) => {
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
        else timeAgo = `${Math.floor(diffMins / 1440)}d ago`;
      }

      return {
        flag: flags[index % flags.length],
        user: truncatedUsername,
        service: order.productName || 'Service',
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

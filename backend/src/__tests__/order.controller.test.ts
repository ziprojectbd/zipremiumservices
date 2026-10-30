import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrder } from '@controllers/order.controller';
import Order from '@models/Order';
import Product from '@models/Product';
import Campaign from '@models/Campaign';
import Coupon from '@models/Coupon';
import PaymentSettings from '@models/PaymentSettings';

const mockOrderFindOne = vi.mocked(Order.findOne);
const mockOrderCreate = vi.mocked(Order.create);
const mockProductFindById = vi.mocked(Product.findById);
const mockCampaignFind = vi.mocked(Campaign.find);
const mockCouponFindOne = vi.mocked(Coupon.findOne);
const mockPaymentSettingsFindOne = vi.mocked(PaymentSettings.findOne);

vi.mock('@models/Order', () => ({
  default: { findOne: vi.fn(), create: vi.fn() },
}));
vi.mock('@models/Product', () => ({ default: { findById: vi.fn() } }));
vi.mock('@models/Campaign', () => ({ default: { find: vi.fn() } }));
vi.mock('@models/Coupon', () => ({ default: { findOne: vi.fn() } }));
vi.mock('@models/PaymentSettings', () => ({
  default: { findOne: vi.fn() },
}));
vi.mock('@db/connect', () => ({ default: vi.fn(async () => {}) }));
vi.mock('@config/env', () => ({
  default: {
    ONESERVICEBD_API_KEY: '',
    TELEGRAM_BOT_TOKEN: '',
    TELEGRAM_CHAT_ID: '',
  },
}));
vi.mock('@utils/geo', () => ({
  getClientIP: vi.fn(() => ''),
  getGeoFromIP: vi.fn(async () => ({ country: '', countryCode: '' })),
  countryCodeToFlag: vi.fn(() => ''),
}));
vi.mock('@utils/providerMapper', () => ({
  mapOrderToProvider: vi.fn(),
  getProviderEndpoint: vi.fn(() => ''),
}));
vi.mock('@utils/addons', () => ({
  captchamasterAddons: vi.fn(() => []),
  orderKblSelected: vi.fn(() => false),
}));
vi.mock('@utils/driveDownload', () => ({
  extractGoogleDriveFileId: vi.fn(() => ''),
  fetchDriveFile: vi.fn(),
  attachmentHeader: vi.fn(() => 'attachment'),
}));
vi.mock('axios', () => ({ default: { post: vi.fn() } }));

function makeRes() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const next = vi.fn();
  return { status, json, next } as any;
}

// asyncHandler swallows the inner promise, so flush the micro/macro-task queue
// before asserting on the response.
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

const productDoc = {
  _id: 'prod1234567890abcdef123456',
  priceBDT: 1500,
  priceUSDT: 0,
  name: 'Widget',
  category: '',
  smmProvider: '',
  smmServiceId: '',
};

const campaignDoc = {
  status: 'active',
  isActive: true,
  applicableProducts: ['prod1234567890abcdef123456'],
  getEffectivePrice: (base: number) => ({
    discountPrice: 999,
    discountPercent: 33.4,
    amountSaved: 501,
  }),
};

function chainableMock(resolved: any) {
  return { lean: vi.fn().mockResolvedValue(resolved) } as any;
}

function settingsMock() {
  return {
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue({ exchangeRate: 110 }),
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockProductFindById.mockImplementation(() => chainableMock(productDoc));
  mockCampaignFind.mockImplementation(() => chainableMock([campaignDoc]));
  mockCouponFindOne.mockResolvedValue(null);
  mockPaymentSettingsFindOne.mockImplementation(settingsMock);
  mockOrderFindOne.mockImplementation(() => chainableMock(null));
  mockOrderCreate.mockResolvedValue({
    _id: 'ord1',
    orderNumber: 'ORD-1',
  } as any);
});

function makeReq(overrides: Record<string, any> = {}) {
  return {
    body: {
      email: 'buyer@example.com',
      items: [{ product: 'prod1234567890abcdef123456', quantity: 1, price: 1500 }],
      totalAmount: 999,
      paymentMethod: 'bkash',
      trxId: 'TRX-123',
      ...overrides,
    },
    headers: {},
  } as any;
}
describe('createOrder — BDT manual (mobile wallet) payments', () => {
  it('creates the order with the server-calculated discounted total (৳1,500 → ৳999) and does not reject on client/gateway amount drift', async () => {
    const req = makeReq({ totalAmount: 1 });
    const res = makeRes();

    createOrder(req, res, res.next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
    const created = mockOrderCreate.mock.calls[0][0] as any;
    expect(created.amount).toBe(999);
    expect(created.totalAmount).toBe(999);
    expect(created.transactionId).toBe('TRX-123');
    expect(created.paymentStatus).toBe('pending');
    expect(created.currency).toBe('BDT');
  });

  it('applies a coupon-only discount server-side (flat ৳100 off ৳1,500 → ৳1,400)', async () => {
    mockCampaignFind.mockImplementation(() => chainableMock([]));
    mockCouponFindOne.mockResolvedValue({
      code: 'SAVE100',
      isActive: true,
      expiresAt: null,
      usageLimit: 0,
      usedCount: 0,
      minOrderAmount: 0,
      discountType: 'flat',
      discountValue: 100,
      maxDiscountAmount: 0,
    } as any);
    const res = makeRes();
    createOrder(makeReq({ totalAmount: 1400, couponCode: 'SAVE100' }), res, res.next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(201);
    const created = mockOrderCreate.mock.calls[0][0] as any;
    expect(created.amount).toBe(1400);
    expect(created.discountAmount).toBe(100);
    expect(created.couponCode).toBe('SAVE100');
  });

  it('applies combined campaign + coupon discount (৳1,500 → ৳999 → ৳899)', async () => {
    mockCouponFindOne.mockResolvedValue({
      code: 'EXTRA50',
      isActive: true,
      expiresAt: null,
      usageLimit: 0,
      usedCount: 0,
      minOrderAmount: 0,
      discountType: 'flat',
      discountValue: 100,
      maxDiscountAmount: 0,
    } as any);
    const res = makeRes();
    createOrder(makeReq({ totalAmount: 899, couponCode: 'EXTRA50' }), res, res.next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(201);
    const created = mockOrderCreate.mock.calls[0][0] as any;
    expect(created.amount).toBe(899);
    expect(created.discountAmount).toBe(100);
  });

  it('keeps manual payments pending (not auto-approved) when a TrxID is submitted', async () => {
    const res = makeRes();
    createOrder(makeReq(), res, res.next);
    await flush();

    const created = mockOrderCreate.mock.calls[0][0] as any;
    expect(created.paymentStatus).toBe('pending');
    expect(created.transactionId).toBe('TRX-123');
  });

  it('rejects a duplicate TrxID for mobile payments', async () => {
    mockOrderFindOne.mockImplementation(() => chainableMock({ _id: 'existing' }));
    const res = makeRes();

    createOrder(makeReq(), res, res.next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockOrderCreate).not.toHaveBeenCalled();
  });

  it('rejects concurrent duplicate submissions via the unique index (code 11000)', async () => {
    mockOrderCreate.mockRejectedValue({
      code: 11000,
      keyValue: { transactionId: 'TRX-123' },
    } as any);
    const res = makeRes();
    createOrder(makeReq(), res, res.next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('rejects fractional BDT amounts', async () => {
    const res = makeRes();
    createOrder(makeReq({ totalAmount: 999.5 }), res, res.next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockOrderCreate).not.toHaveBeenCalled();
  });
});

describe('createOrder — crypto payments keep strict validation', () => {
  it('rejects crypto orders when the client total differs from the server total', async () => {
    const res = makeRes();
    createOrder(
      makeReq({
        paymentMethod: 'paycrypto',
        totalAmount: 1000,
        trxId: '',
      }),
      res,
      res.next,
    );
    await flush();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toContain('Price mismatch');
    expect(mockOrderCreate).not.toHaveBeenCalled();
  });
});

describe('createOrder — rejects stale / expired discounted prices', () => {
  it('rejects a stale campaign price when the campaign is no longer running', async () => {
    // No active campaigns -> server derives the regular price (1500). The
    // client still sends the expired campaign price (999) -> must be rejected.
    mockCampaignFind.mockImplementation(() => chainableMock([]));
    const res = makeRes();
    createOrder(
      makeReq({ totalAmount: 999, items: [{ product: 'prod1234567890abcdef123456', quantity: 1, price: 999 }] }),
      res,
      res.next,
    );
    await flush();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toContain('no longer valid');
    expect(mockOrderCreate).not.toHaveBeenCalled();
  });

  it('accepts the campaign price when the campaign is still running', async () => {
    mockCampaignFind.mockImplementation(() => chainableMock([campaignDoc]));
    const res = makeRes();
    createOrder(
      makeReq({
        totalAmount: 999,
        items: [{ product: 'prod1234567890abcdef123456', quantity: 1, price: 999 }],
      }),
      res,
      res.next,
    );
    await flush();

    expect(res.status).toHaveBeenCalledWith(201);
    const created = mockOrderCreate.mock.calls[0][0] as any;
    expect(created.amount).toBe(999);
  });

  it('does not apply a discount when the campaign is disabled before its scheduled end', async () => {
    mockCampaignFind.mockImplementation(() =>
      chainableMock([{ ...campaignDoc, status: 'expired', isActive: false }]),
    );
    const res = makeRes();
    createOrder(
      makeReq({
        totalAmount: 1500,
        items: [{ product: 'prod1234567890abcdef123456', quantity: 1, price: 1500 }],
      }),
      res,
      res.next,
    );
    await flush();

    expect(res.status).toHaveBeenCalledWith(201);
    const created = mockOrderCreate.mock.calls[0][0] as any;
    expect(created.amount).toBe(1500);
  });
});

import CaptchaPackage from '@models/CaptchaPackage';
import CaptchaOrder from '@models/CaptchaOrder';
import { success, error, paginated } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import { getCaptchaMasterService } from '@utils/captchamaster';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Resolve the customer email for the request.
// Security: a normal user is always scoped to their own account email — the
// ?email= query param is only honoured for admins (support lookups). This
// prevents one logged-in user from reading another customer's packages.
function resolveEmail(req: any): string {
  const userEmail = String(req.user?.email || '').trim().toLowerCase();
  const isAdmin = req.user?.role === 'admin';

  if (isAdmin) {
    const fromQuery = String(req.query?.email || '').trim().toLowerCase();
    if (fromQuery) return fromQuery;
  }
  return userEmail;
}

// A package counts as expired when its end date has passed, or when it has no
// credits left. The vendor's `status` field is not authoritative: it keeps
// reporting "active" for packages whose endDate is in the past, which made
// expired keys show up under "Your Active API Keys".
function isExpiredPackage(expiresAt?: string | null, creditsRemaining?: number): boolean {
  if (typeof creditsRemaining === 'number' && creditsRemaining <= 0) return true;
  if (!expiresAt) return false;
  const target = new Date(expiresAt).getTime();
  if (!Number.isFinite(target)) return false;
  return target <= Date.now();
}

// Derived lifecycle status used by the customer dashboard.
function effectiveStatus(rawStatus: string | undefined, expiresAt?: string | null, creditsRemaining?: number): string {
  const normalized = String(rawStatus || '').toLowerCase();
  if (normalized === 'suspended') return 'suspended';
  if (isExpiredPackage(expiresAt, creditsRemaining)) return 'expired';
  return normalized || 'active';
}

// Normalise a reseller package into the shape the customer dashboard expects.
function toCustomerPackage(p: any) {
  const credits = Number(p.credits ?? 0);
  const creditsUsed = Number(p.creditsUsed ?? 0);
  const creditsRemaining = Number(p.creditsRemaining ?? Math.max(0, credits - creditsUsed));
  const expiresAt = p.expiresAt ?? p.endDate ?? '';
  const apiKey = p.apiKey ?? p.key ?? p.captchaApiKey ?? null;
  return {
    id: String(p.id ?? p._id ?? ''),
    planName: p.planName ?? p.packageName ?? p.packageCode ?? 'Unknown',
    planId: p.planId ?? p.packageCode ?? '',
    credits,
    creditsUsed,
    creditsRemaining,
    price: Number(p.price ?? 0),
    currency: p.currency ?? 'USD',
    status: effectiveStatus(p.status, expiresAt, creditsRemaining),
    expiresAt,
    activatedAt: p.startDate ?? p.activatedAt ?? p.createdAt ?? '',
    captchaMasterPackageId: String(p.id ?? p._id ?? ''),
    captchaApiKey: apiKey,
    packageType: p.packageType ?? '',
    createdAt: p.createdAt ?? '',
  };
}

function toLocalPackage(p: any) {
  const credits = Number(p.credits ?? 0);
  const creditsUsed = Number(p.creditsUsed ?? 0);
  const creditsRemaining = Number(p.creditsRemaining ?? Math.max(0, credits - creditsUsed));
  const expiresAt = p.expiresAt ? new Date(p.expiresAt).toISOString() : '';
  return {
    id: p.captchaMasterPackageId || String(p._id ?? ''),
    planName: p.planName ?? 'Unknown',
    planId: p.planId ?? '',
    credits,
    creditsUsed,
    creditsRemaining,
    price: Number(p.price ?? 0),
    currency: p.currency ?? 'USD',
    status: effectiveStatus(p.status, expiresAt, creditsRemaining),
    expiresAt,
    activatedAt: p.activatedAt ? new Date(p.activatedAt).toISOString() : '',
    captchaMasterPackageId: p.captchaMasterPackageId || String(p._id ?? ''),
    captchaApiKey: p.captchaApiKey ?? null,
    packageType: p.packageType || '',
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : '',
  };
}

async function loadResellerPackagesFor(email: string) {
  const service = await getCaptchaMasterService();
  const all = await service.getPackages();
  return all
    .filter((p: any) => String(p.customerEmail || '').toLowerCase().trim() === email)
    .map((p: any) => toCustomerPackage(p));
}

async function loadLocalPackagesFor(email: string) {
  const docs = await CaptchaPackage.find({ customerEmail: email }).sort({ createdAt: -1 }).limit(200).lean();
  return docs.map(toLocalPackage);
}

// GET /captchamaster/packages
export const getCustomerPackages = asyncHandler(async (req, res) => {
  const email = resolveEmail(req);
  if (!email) {
    return res.status(400).json(error('Customer email is required (sign in or pass ?email=)'));
  }

  const page = Math.max(1, parseInt(String(req.query.page || ''), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || ''), 10) || 10));
  const search = String(req.query.search || '').toLowerCase().trim();

  let resellerPackages: any[] = [];
  let resellerError = '';
  try {
    resellerPackages = await loadResellerPackagesFor(email);
  } catch (err: any) {
    resellerError = err?.message || 'CaptchaMaster API unavailable';
  }

  // Local packages are merged in so a purchase is still visible if the reseller
  // API is down. Reseller data wins on duplicate ids.
  let localPackages: any[] = [];
  try {
    localPackages = await loadLocalPackagesFor(email);
  } catch {
    localPackages = [];
  }

  const merged = new Map<string, any>();
  for (const p of localPackages) merged.set(p.id, p);
  for (const p of resellerPackages) merged.set(p.id, p);

  let data = Array.from(merged.values());

  // Expired/exhausted packages never belong under "Your Active API Keys", but
  // they are not deleted either — the dashboard shows them behind a History
  // toggle. Three modes:
  //  - default                → active packages only
  //  - `history=true`         → expired/exhausted only (the History panel)
  //  - `includeExpired=true`  → everything (admin support lookups)
  const isExpired = (p: any) => p.status === 'expired';
  const wantsEverything =
    String(req.query.includeExpired || '').toLowerCase() === 'true' && req.user?.role === 'admin';
  const wantsHistory = String(req.query.history || '').toLowerCase() === 'true';

  if (!wantsEverything) {
    data = wantsHistory ? data.filter(isExpired) : data.filter((p) => !isExpired(p));
  }

  if (search) {
    data = data.filter(
      (p) =>
        String(p.planName || '').toLowerCase().includes(search) ||
        String(p.status || '').toLowerCase().includes(search)
    );
  }
  data.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  const total = data.length;
  const paged = data.slice((page - 1) * limit, page * limit);

  const response = paginated(paged, total, page, limit) as unknown as Record<string, unknown>;
  if (resellerError) {
    response.resellerConnected = false;
    response.resellerError = resellerError;
  } else {
    response.resellerConnected = true;
  }
  return res.json(response);
});

// GET /captchamaster/orders
export const getCustomerOrders = asyncHandler(async (req, res) => {
  const email = resolveEmail(req);
  if (!email) {
    return res.status(400).json(error('Customer email is required (sign in or pass ?email=)'));
  }

  const page = Math.max(1, parseInt(String(req.query.page || ''), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || ''), 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { customerEmail: email };

  const [orders, total, resellerPackages] = await Promise.all([
    CaptchaOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    CaptchaOrder.countDocuments(filter),
    (async () => {
      try {
        const service = await getCaptchaMasterService();
        return await service.getPackages();
      } catch {
        return [];
      }
    })(),
  ]);

  // Our storefront orders. Also expose reseller-side packages as synthetic
  // order entries so a purchase made directly on CaptchaMaster still appears.
  const localOrders = orders.map((o: any) => ({
    id: String(o._id),
    orderNumber: o.orderNumber || String(o._id),
    planName: o.planName || '',
    credits: Number(o.credits || 0),
    amount: Number(o.amount || 0),
    currency: o.currency || 'USD',
    status: o.status || 'pending',
    paymentGatewayRef: o.paymentGatewayRef || null,
    captchaMasterPackageId: o.captchaMasterPackageId || null,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : '',
    completedAt: o.completedAt ? new Date(o.completedAt).toISOString() : null,
  }));

  const localPlanKeys = new Set(
    localOrders.map((o) => `${o.planName || ''}`.toLowerCase()).filter(Boolean)
  );

  const resellerOrders = (resellerPackages || [])
    .filter((p: any) => String(p.customerEmail || '').toLowerCase().trim() === email)
    .filter((p: any) => {
      const name = String(p.packageName || p.packageCode || '').toLowerCase();
      return name && !localPlanKeys.has(name);
    })
    .map((p: any) => ({
      id: String(p._id || p.id),
      orderNumber: `CM-${String(p.packageCode || p._id || '').slice(-8)}`,
      planName: p.packageName || p.packageCode || '',
      credits: Number(p.credits || 0),
      amount: Number(p.price || 0),
      currency: 'USD',
      status: p.status || 'completed',
      paymentGatewayRef: null,
      captchaMasterPackageId: String(p._id || p.id),
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : '',
      completedAt: p.endDate ? new Date(p.endDate).toISOString() : null,
    }));

  const data = [...localOrders, ...resellerOrders].sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  );

  const totalCount = total + resellerOrders.length;
  return res.json(paginated(data, totalCount, page, limit));
});

import CaptchaPackage from '@models/CaptchaPackage';
import CaptchaOrder from '@models/CaptchaOrder';
import CaptchaApiKey from '@models/CaptchaApiKey';
import CaptchaMasterSettings from '@models/CaptchaMasterSettings';
import connectDB from '@db/connect';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import { getCaptchaMasterService, CaptchaMasterError } from '@utils/captchamaster';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

// Reseller package shape returned to the admin UI. Reseller API uses
// packageCode/packageName/endDate/key while the UI expects
// planName/expiresAt/key — normalise here so both sources look identical.
function toAdminPackage(p: any) {
  const credits = Number(p.credits ?? 0);
  const creditsUsed = Number(p.creditsUsed ?? 0);
  return {
    id: String(p.id ?? p._id ?? ''),
    planId: p.planId ?? p.packageCode ?? '',
    planName: p.planName ?? p.packageName ?? p.packageCode ?? 'Unknown',
    credits,
    creditsUsed,
    creditsRemaining: Number(p.creditsRemaining ?? Math.max(0, credits - creditsUsed)),
    price: Number(p.price ?? 0),
    customerEmail: p.customerEmail ?? '',
    status: p.status ?? 'active',
    expiresAt: p.expiresAt ?? p.endDate ?? '',
    createdAt: p.createdAt ?? '',
    startDate: p.startDate ?? p.activatedAt ?? p.createdAt ?? '',
    endDate: p.endDate ?? p.expiresAt ?? '',
    key: p.key ?? p.apiKey ?? p.captchaApiKey ?? '',
    packageType: p.packageType ?? '',
    source: p.source ?? 'reseller',
  };
}

function toAdminApiKey(k: any) {
  return {
    id: String(k.id ?? k._id ?? ''),
    name: k.name ?? '',
    key: k.key ?? '',
    status: k.status ?? 'active',
    createdAt: k.createdAt ?? '',
    lastUsed: k.lastUsed ?? undefined,
    usageCount: Number(k.usageCount ?? 0),
    prefix: k.prefix ?? '',
  };
}

// Local Mongo docs (created by our own delivery/webhook flow) are merged in so
// packages bought through this storefront are never hidden if the reseller API
// is temporarily unreachable.
function toLocalPackage(p: any) {
  const credits = Number(p.credits ?? 0);
  const creditsUsed = Number(p.creditsUsed ?? 0);
  return {
    id: p.captchaMasterPackageId || String(p._id ?? ''),
    planId: p.planId ?? '',
    planName: p.planName ?? 'Unknown',
    credits,
    creditsUsed,
    creditsRemaining: Number(p.creditsRemaining ?? Math.max(0, credits - creditsUsed)),
    price: Number(p.price ?? 0),
    customerEmail: p.customerEmail ?? '',
    status: p.status ?? 'active',
    expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString() : '',
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : '',
    startDate: p.activatedAt ? new Date(p.activatedAt).toISOString() : '',
    endDate: p.expiresAt ? new Date(p.expiresAt).toISOString() : '',
    key: p.captchaApiKey ?? '',
    packageType: '',
    source: 'local',
  };
}

async function loadLocalPackages() {
  try {
    const docs = await CaptchaPackage.find().sort({ createdAt: -1 }).limit(500).lean();
    return docs.map(toLocalPackage);
  } catch {
    return [];
  }
}

// Calls the reseller API and returns its packages. Throws CaptchaMasterError
// (propagated to the client) so the admin sees the real reason (bad key,
// network, rate limit) instead of an empty list.
async function loadResellerPackages() {
  const service = await getCaptchaMasterService();
  const pkgs = await service.getPackages();
  return pkgs.map((p: any) => toAdminPackage(p));
}

// GET /api/admin/captchamaster/stats
export const getAdminCaptchaStats = asyncHandler(async (req, res) => {
  await connectDB();

  const [totalPackages, totalApiKeys, activePackages, totalOrders] = await Promise.all([
    CaptchaPackage.countDocuments(),
    CaptchaApiKey.countDocuments(),
    CaptchaPackage.countDocuments({ status: 'active' }),
    CaptchaOrder.countDocuments(),
  ]);

  const creditsAgg = await CaptchaPackage.aggregate([
    { $group: { _id: null, total: { $sum: '$credits' }, used: { $sum: '$creditsUsed' } } },
  ]);

  const uniqueCustomers = await CaptchaPackage.distinct('customerEmail');

  const base = {
    // Local storefront numbers (always available)
    localOrders: totalOrders,
    localActivePackages: activePackages,
    localPackages: totalPackages,
    localApiKeys: totalApiKeys,
    credits: creditsAgg[0]?.total || 0,
    totalUsed: creditsAgg[0]?.used || 0,
    totalCustomers: uniqueCustomers.length,
    totalPackages,
    totalApiKeys,
    totalSuccess: activePackages,
    totalFailed: 0,
  };

  // Reseller wallet stats — the authoritative source for the admin dashboard.
  // If the key is missing/invalid we still return local numbers plus a warning
  // instead of failing the whole page.
  try {
    const service = await getCaptchaMasterService();
    const stats = await service.getStats();

    return res.json(
      success({
        credits: Number((stats as any).totalCredits ?? (stats as any).credits ?? base.credits),
        totalUsed: Number((stats as any).totalUsed ?? base.totalUsed),
        totalCustomers: Number((stats as any).totalCustomers ?? base.totalCustomers),
        totalPackages: base.localPackages,
        totalApiKeys: Number((stats as any).totalApiKeys ?? base.totalApiKeys),
        activeApiKeys: Number((stats as any).activeApiKeys ?? 0),
        totalSuccess: base.localActivePackages,
        totalFailed: 0,
        usagePercentage: Number((stats as any).usagePercentage ?? 0),
        localOrders: base.localOrders,
        localActivePackages: base.localActivePackages,
        resellerConnected: true,
      })
    );
  } catch (err: any) {
    return res.json(
      success({
        ...base,
        resellerConnected: false,
        resellerError: err?.message || 'CaptchaMaster API unavailable',
      })
    );
  }
});

// GET /api/admin/captchamaster/packages
export const getAdminCaptchaPackages = asyncHandler(async (req, res) => {
  await connectDB();

  const search = String(req.query.search || '').toLowerCase().trim();

  let resellerPackages: any[] = [];
  let resellerError = '';
  try {
    resellerPackages = await loadResellerPackages();
  } catch (err: any) {
    resellerError = err?.message || 'CaptchaMaster API unavailable';
  }

  const localPackages = await loadLocalPackages();

  // Merge reseller + local, dedupe by id (reseller wins), newest first.
  const merged = new Map<string, any>();
  for (const p of localPackages) merged.set(p.id, p);
  for (const p of resellerPackages) merged.set(p.id, p);

  let data = Array.from(merged.values());
  if (search) {
    data = data.filter(
      (p) =>
        String(p.planName || '').toLowerCase().includes(search) ||
        String(p.customerEmail || '').toLowerCase().includes(search) ||
        String(p.planId || '').toLowerCase().includes(search)
    );
  }
  data.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  return res.json(
    success({
      data,
      total: data.length,
      page: 1,
      pages: data.length ? 1 : 0,
      resellerConnected: !resellerError,
      ...(resellerError ? { resellerError } : {}),
    })
  );
});

// DELETE /api/admin/captchamaster/packages/:id
export const deleteAdminCaptchaPackage = asyncHandler(async (req, res) => {
  await connectDB();

  const id = String(req.params.id);
  let resellerDeleted = false;
  let resellerError = '';
  try {
    const service = await getCaptchaMasterService();
    await service.deletePackage(id);
    resellerDeleted = true;
  } catch (err: any) {
    // Reseller may not know this id (locally-created package) — fall through
    // and still remove the local copy.
    resellerError = err?.message || 'Failed to delete package remotely';
  }

  // Remove the local mirror too (matched by reseller package id or Mongo _id).
  let localDeleted = false;
  try {
    const local = await CaptchaPackage.findOneAndDelete({
      $or: [
        { captchaMasterPackageId: id },
        ...(id.length === 24 && /^[a-f0-9]+$/i.test(id) ? [{ _id: id }] : []),
      ],
    });
    localDeleted = Boolean(local);
  } catch {
    localDeleted = false;
  }

  if (!resellerDeleted && !localDeleted) {
    return res
      .status(resellerError ? 502 : 404)
      .json(error(resellerError || 'Package not found'));
  }

  return res.json(success({ resellerDeleted, localDeleted }, 'Package deleted'));
});

// GET /api/admin/captchamaster/api-keys
export const getAdminCaptchaApiKeys = asyncHandler(async (req, res) => {
  await connectDB();

  try {
    const service = await getCaptchaMasterService();
    const keys = await service.getApiKeys();
    return res.json(success(keys.map((k: any) => toAdminApiKey(k))));
  } catch (err: any) {
    // Fall back to local keys so the tab still renders offline.
    const local = await CaptchaApiKey.find().sort({ createdAt: -1 }).lean();
    return res.json(
      success(
        local.map((k) =>
          toAdminApiKey({
            id: String(k._id),
            name: k.name,
            key: k.key,
            status: k.status,
            createdAt: k.createdAt,
            lastUsed: k.lastUsed,
          })
        )
      )
    );
  }
});

// POST /api/admin/captchamaster/api-keys
export const createAdminCaptchaApiKey = asyncHandler(async (req, res) => {
  await connectDB();

  const { name } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json(error('Name is required'));
  }

  const service = await getCaptchaMasterService();
  const created = await service.createApiKey(String(name).trim());

  return res.status(201).json(success(toAdminApiKey(created)));
});

// PUT /api/admin/captchamaster/api-keys/:id/regenerate
export const regenerateAdminCaptchaApiKey = asyncHandler(async (req, res) => {
  await connectDB();

  const service = await getCaptchaMasterService();
  const updated = await service.regenerateApiKey(String(req.params.id));

  return res.json(success(toAdminApiKey(updated)));
});

// DELETE /api/admin/captchamaster/api-keys/:id
export const deleteAdminCaptchaApiKey = asyncHandler(async (req, res) => {
  await connectDB();

  const id = String(req.params.id);

  const service = await getCaptchaMasterService();
  await service.deleteApiKey(id);

  // Best-effort local mirror cleanup (legacy locally-created keys).
  try {
    await CaptchaApiKey.findOneAndDelete({
      $or: [
        { key: id },
        ...(id.length === 24 && /^[a-f0-9]+$/i.test(id) ? [{ _id: id }] : []),
      ],
    });
  } catch {
    /* ignore */
  }

  return res.json(success(null, 'API key deleted'));
});

// Helper — singleton settings getter (creates default doc on first access)
async function getCaptchaGlobalSettings() {
  let doc = await CaptchaMasterSettings.findById('global').lean();
  if (!doc) {
    const created = await CaptchaMasterSettings.create({ _id: 'global' });
    doc = created.toObject();
  }
  return doc;
}

// GET /api/admin/captchamaster/settings — fetch reseller & pricing settings
export const getAdminCaptchaSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const settings = await getCaptchaGlobalSettings();

  return res.json(
    success({
      discountPercent: settings.discountPercent,
      discountEnabled: settings.discountEnabled,
      exchangeRate: settings.exchangeRate,
      resellerApiKey: settings.resellerApiKey || '',
    })
  );
});

// PUT /api/admin/captchamaster/settings — update reseller & pricing settings
export const updateAdminCaptchaSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const { discountPercent, discountEnabled, exchangeRate, resellerApiKey } = req.body;

  const update: Record<string, unknown> = {};
  if (discountPercent !== undefined) {
    const pct = Number(discountPercent);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json(error('discountPercent must be a number between 0 and 100'));
    }
    update.discountPercent = pct;
  }
  if (discountEnabled !== undefined) {
    update.discountEnabled = Boolean(discountEnabled);
  }
  if (exchangeRate !== undefined) {
    const rate = Number(exchangeRate);
    if (Number.isNaN(rate) || rate < 1) {
      return res.status(400).json(error('exchangeRate must be a number greater than 0'));
    }
    update.exchangeRate = rate;
  }
  if (resellerApiKey !== undefined) {
    update.resellerApiKey = String(resellerApiKey || '').trim();
  }

  const settings = await CaptchaMasterSettings.findByIdAndUpdate('global', update, {
    new: true,
    upsert: true,
  });

  // The reseller key is cached in the service singleton; drop it so the new key
  // is picked up on the very next request (no server restart needed).
  if (resellerApiKey !== undefined) {
    const { resetCaptchaMasterService } = await import('@utils/captchamaster');
    resetCaptchaMasterService();
  }

  return res.json(
    success({
      discountPercent: settings.discountPercent,
      discountEnabled: settings.discountEnabled,
      exchangeRate: settings.exchangeRate,
      resellerApiKey: settings.resellerApiKey || '',
    })
  );
});

// POST /api/admin/captchamaster/test — verify the reseller API key works.
// Accepts an optional `resellerApiKey` in the body so the admin can validate a
// key BEFORE saving it.
export const testAdminCaptchaConnection = asyncHandler(async (req, res) => {
  await connectDB();

  const bodyKey = String(req.body?.resellerApiKey || '').trim();
  let apiKey = bodyKey;

  if (!apiKey) {
    const settings = await getCaptchaGlobalSettings();
    apiKey = String(settings.resellerApiKey || '').trim();
  }

  if (!apiKey) {
    return res.status(400).json(error('No reseller API key configured. Save a key first.'));
  }

  try {
    const service = await getCaptchaMasterService();
    const stats = await service.getStats();
    return res.json(
      success({
        connected: true,
        keyPrefix: `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`,
        stats,
      })
    );
  } catch (err: any) {
    const statusCode = err instanceof CaptchaMasterError ? err.statusCode : undefined;
    const message =
      err?.message || 'Failed to connect to CaptchaMaster. Check the API key.';
    // 401 from reseller = wrong/revoked key → surface as 400 (client error).
    return res.status(statusCode === 401 ? 400 : 502).json(error(message));
  }
});

import axios from 'axios';
import SmmSettings from '@models/SmmSettings';
import Product from '@models/Product';
import connectDB from '@db/connect';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import env from '@config/env';

// GET /api/smm/services — returns categories, balance, and counts
export const getSmmServices = asyncHandler(async (req, res) => {
  await connectDB();

  let settings = await SmmSettings.findOne().lean() as Record<string, unknown> | null;

  if (!settings) {
    settings = (await SmmSettings.create({})).toObject();
  }

  if (!settings) {
    return res.status(500).json(error('Failed to create settings'));
  }

  // Respond in the format the frontend expects
  return res.json(success({
    categories: settings.categories || [],
    balance: settings.balance ?? 0,
    currency: settings.currency || 'BDT',
    total: settings.totalServices || 0,
    synced: settings.syncedServices || 0,
  }));
});

// GET /api/smm/settings — returns settings (markup, overrides, etc.)
export const getSmmSettings = asyncHandler(async (req, res) => {
  await connectDB();

  let settings = await SmmSettings.findOne().lean() as Record<string, unknown> | null;

  if (!settings) {
    settings = (await SmmSettings.create({})).toObject();
  }

  if (!settings) {
    return res.status(500).json(error('Failed to create settings'));
  }

  return res.json(success(settings));
});

// PUT /api/smm/settings
export const updateSmmSettings = asyncHandler(async (req, res) => {
  await connectDB();

  // Handle categoryOrderFields specially — merge so UI partial saves don't wipe auto-generated ones
  const { categoryOrderFields, ...rest } = req.body;

  const setData: Record<string, unknown> = { ...rest };

  if (categoryOrderFields) {
    const existing = await SmmSettings.findOne().lean();
    const merged: Record<string, unknown> = { ...(existing?.categoryOrderFields as Record<string, unknown> || {}), ...categoryOrderFields as Record<string, unknown> };

    // Normalize each field: if it has "name" but no "key", copy name → key
    for (const [cat, fields] of Object.entries(merged)) {
      if (Array.isArray(fields)) {
        (merged as Record<string, unknown>)[cat] = fields.map((f: Record<string, unknown>) => {
          if (!f.key && f.name) return { ...f, key: f.name };
          return f;
        });
      }
    }

    setData.categoryOrderFields = merged;
  }

  const settings = await SmmSettings.findOneAndUpdate(
    {},
    { $set: setData },
    { new: true, upsert: true, runValidators: true }
  );

  return res.json(success(settings, 'SMM settings updated'));
});

// DELETE /api/smm/products — delete all synced SMM products AND platforms
export const deleteSmmProducts = asyncHandler(async (req, res) => {
  await connectDB();

  const result = await Product.deleteMany({ smmProvider: 'oneservicebd' });

  // Also wipe all platform/category data — user will re-fetch
  await SmmSettings.findOneAndUpdate(
    {},
    {
      $set: {
        categories: [],
        services: [],
        totalServices: 0,
        syncedServices: 0,
        syncStatus: 'idle',
        lastSyncAt: null,
        lastErrorMessage: '',
        enabledCategories: [],
        platformImages: {},
        categoryOverrides: {},
      },
    },
    { upsert: true }
  );

  return res.json(success({ deleted: result.deletedCount }, `Deleted ${result.deletedCount} SMM products`));
});

// POST /api/smm/fetch-platforms — fetch only platform names from API (no product sync)
// PURE pass-through: never merges with DB state, never writes to DB.
export const fetchSmmPlatforms = asyncHandler(async (req, res) => {
  const apiKey = env.ONESERVICEBD_API_KEY;
  if (!apiKey) {
    return res.status(400).json(error('ONESERVICEBD_API_KEY is not configured in .env'));
  }

  const servicesRes = await axios.post('https://oneservicebd.com/api/v2', {
    key: apiKey,
    action: 'services',
  }, { timeout: 30000 });

  const services = servicesRes.data;
  if (!Array.isArray(services)) {
    throw new Error('Invalid services response from API');
  }

  // Group by category — pure API data, no DB merge
  const categoryMap = new Map<string, { name: string; serviceCount: number; syncedCount: number; enabled: boolean }>();
  for (const svc of services) {
    const catName = svc.category || 'Others';
    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, { name: catName, serviceCount: 0, syncedCount: 0, enabled: false });
    }
    categoryMap.get(catName)!.serviceCount++;
  }

  const categories = Array.from(categoryMap.values());

  return res.json(success({
    categories,
    total: services.length,
  }, `Found ${categories.length} platforms with ${services.length} total services`));
});

// POST /api/smm/sync — fetch services from oneservicebd API
export const syncSmmServices = asyncHandler(async (req, res) => {
  await connectDB();

  const apiKey = env.ONESERVICEBD_API_KEY;
  if (!apiKey) {
    return res.status(400).json(error('ONESERVICEBD_API_KEY is not configured in .env'));
  }

  const platform = req.body?.platform as string | undefined; // optional per-platform sync

  // Set status to syncing
  await SmmSettings.findOneAndUpdate(
    {},
    { $set: { syncStatus: 'syncing', lastSyncAt: new Date() } },
    { upsert: true }
  );

  try {
    // Fetch balance
    const [balanceRes, servicesRes] = await Promise.all([
      axios.post('https://oneservicebd.com/api/v2', {
        key: apiKey,
        action: 'balance',
      }, { timeout: 15000 }),
      axios.post('https://oneservicebd.com/api/v2', {
        key: apiKey,
        action: 'services',
      }, { timeout: 30000 }),
    ]);

    const rawBalance = balanceRes.data?.balance || 0;
    const currency = balanceRes.data?.currency || 'BDT';
    const services = servicesRes.data;

    if (!Array.isArray(services)) {
      throw new Error('Invalid services response from API');
    }

    // Filter by platform if specified
    const filteredServices = platform
      ? services.filter((svc: Record<string, unknown>) => (svc.category || 'Others') === platform)
      : services;

    // Group services by category and count
    const categoryMap = new Map<string, { name: string; serviceCount: number; syncedCount: number; enabled: boolean }>();
    for (const svc of services) {
      const catName = svc.category || 'Others';
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, { name: catName, serviceCount: 0, syncedCount: 0, enabled: false });
      }
      categoryMap.get(catName)!.serviceCount++;
    }

    // Count synced (filtered) services per category
    for (const svc of filteredServices) {
      const catName = svc.category || 'Others';
      if (categoryMap.has(catName)) {
        categoryMap.get(catName)!.syncedCount++;
      }
    }

    // Restore enabled state from existing DB categories
    // (this preserves toggles set via the UI and saved via Save Settings)
    const existing = await SmmSettings.findOne().lean();
    const existingCats = (existing?.categories || []) as Array<{ name: string; enabled: boolean }>;
    const enabledMap = new Map(existingCats.map((c) => [c.name, c.enabled]));
    const categories = Array.from(categoryMap.values()).map((cat) => ({
      ...cat,
      enabled: enabledMap.has(cat.name) ? enabledMap.get(cat.name) : false,
    }));

    // Get markup percent for price calculation
    const markupPercent = existing?.markupPercent ?? 20;

    // Get platform images so we can set imageUrl on each product
    const platformImages = (existing?.platformImages || {}) as Record<string, string>;

    // Upsert Product documents for each SMM service
    const syncedIds: string[] = [];
    for (const svc of filteredServices) {
      const serviceId = String(svc.service || svc.id || '');
      if (!serviceId) continue;
      syncedIds.push(serviceId);

      const rate = parseFloat(svc.rate || svc.price || 0);
      const price = rate > 0 ? rate * (1 + markupPercent / 100) : 0;

      const finalPrice = Math.round(price * 100) / 100;

      await Product.findOneAndUpdate(
        { smmServiceId: serviceId, smmProvider: 'oneservicebd' },
        {
          $set: {
            name: svc.name || svc.service || 'Unknown Service',
            category: svc.category || 'Others',
            price: finalPrice,
            priceBDT: finalPrice,
            stock: 999999,
            description: svc.description || '',
            available: true,
            smmProvider: 'oneservicebd',
            smmMin: svc.min ? parseInt(svc.min, 10) : undefined,
            smmMax: svc.max ? parseInt(svc.max, 10) : undefined,
            imageUrl: platformImages[svc.category as string] || '',
            images: platformImages[svc.category as string] ? [platformImages[svc.category as string]] : [],
          },
          $setOnInsert: {
            smmServiceId: serviceId,
            showStock: false,
            details: `Minimum Order: ${svc.min || 'N/A'}\nMaximum Order: ${svc.max || 'N/A'}`,
          },
        },
        { upsert: true }
      );
    }

    // If syncing a specific platform, only remove that platform's stale products.
    // If full sync, remove all stale products.
    const staleFilter: Record<string, unknown> = { smmProvider: 'oneservicebd' };
    if (platform) {
      staleFilter.category = platform;
    }
    if (syncedIds.length > 0) {
      staleFilter.smmServiceId = { $nin: syncedIds };
      await Product.deleteMany(staleFilter);
    }

    // Batch-fetch service descriptions from oneservicebd.com website
    // (separate endpoint not available in the main API)
    // First establish a session by visiting the services page
    const cookieJar = new Map<string, string>();
    try {
      const sessRes = await axios.get('https://oneservicebd.com/services', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 15000,
        maxRedirects: 0,
        validateStatus: (s) => s < 400,
      });
      const setCookie = sessRes.headers['set-cookie'] || [];
      const raw = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie);
      const phpsessid = raw.match(/PHPSESSID=([^;]+)/);
      const csrf = raw.match(/_csrf=([^;]+)/);
      if (phpsessid) cookieJar.set('PHPSESSID', phpsessid[1]);
      if (csrf) cookieJar.set('_csrf', csrf[1]);
    } catch {
      // Session establishment failed — skip description fetch
    }

    const sessionCookie = Array.from(cookieJar.entries())
      .map(([k, v]) => `${k}=${v}`).join('; ');

    const DESC_BATCH = 5;
    for (let i = 0; i < syncedIds.length; i += DESC_BATCH) {
      const batch = syncedIds.slice(i, i + DESC_BATCH);
      await Promise.allSettled(batch.map(async (serviceId) => {
        try {
          const descRes = await axios.get(
            `https://oneservicebd.com/services/get-service-description/${serviceId}`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://oneservicebd.com/services',
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': sessionCookie,
              },
              timeout: 15000,
            }
          );
          const apiDesc = descRes.data?.description;
          if (apiDesc && typeof apiDesc === 'string' && apiDesc.trim()) {
            const svc = filteredServices.find((s: Record<string, unknown>) =>
              String(s.service || s.id || '') === serviceId
            );
            const min = svc?.min ?? 'N/A';
            const max = svc?.max ?? 'N/A';
            const fullDetails = `${apiDesc.trim()}\nMinimum Order: ${min}\nMaximum Order: ${max}`;
            await Product.findOneAndUpdate(
              { smmServiceId: serviceId, smmProvider: 'oneservicebd' },
              { $set: { details: fullDetails } }
            );
          }
        } catch {
          // Non-blocking — keep existing details
        }
      }));
    }

    // Apply category-level orderFields to synced products
    const smmSettingsDoc = await SmmSettings.findOne().lean();
    let catOrderFields = (smmSettingsDoc?.categoryOrderFields || {}) as Record<string, unknown>;

    // Auto-generate default orderFields for any category that doesn't have them yet
    const defaultOrderFields: Record<string, unknown> = {
      'Facebook': [
        { key: 'link', label: 'Post/Profile Link', type: 'url', required: true, placeholder: 'https://facebook.com/...' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '100' },
        { key: 'comment_text', label: 'Comment Text', type: 'textarea', placeholder: 'Optional comment content', required: false },
      ],
      'YouTube': [
        { key: 'link', label: 'Video URL', type: 'url', required: true, placeholder: 'https://youtube.com/watch?v=...' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '1000' },
        { key: 'duration', label: 'Duration (hours)', type: 'select', options: ['1', '2', '4', '8', '12', '24', '48'], defaultValue: '24', required: false },
      ],
      'Instagram': [
        { key: 'link', label: 'Post/Profile URL', type: 'url', required: true, placeholder: 'https://instagram.com/...' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '100' },
        { key: 'username', label: 'Username (optional)', type: 'text', placeholder: '@username', required: false },
      ],
      'TikTok': [
        { key: 'link', label: 'Video URL', type: 'url', required: true, placeholder: 'https://tiktok.com/@user/video/...' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '100' },
        { key: 'username', label: 'Username', type: 'text', placeholder: '@username', required: false },
      ],
      'Telegram': [
        { key: 'username', label: 'Channel/Group Username', type: 'text', required: true, placeholder: '@channel_name' },
        { key: 'post_link', label: 'Post Link', type: 'url', placeholder: 'https://t.me/channel/123', required: false },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '1000' },
      ],
      'Twitter': [
        { key: 'link', label: 'Tweet URL', type: 'url', required: true, placeholder: 'https://twitter.com/user/status/...' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '100' },
      ],
      'Free Fire': [
        { key: 'player_id', label: 'Player ID', type: 'text', required: true, placeholder: 'Enter Free Fire ID' },
        { key: 'nickname', label: 'Nickname', type: 'text', required: true, placeholder: 'In-game name' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '100' },
        { key: 'server', label: 'Server', type: 'select', options: ['BR', 'IND', 'ID', 'RU', 'SG', 'US', 'Other'], defaultValue: 'BR', required: false },
      ],
      'Website Traffic': [
        { key: 'link', label: 'Website Link', type: 'url', required: true, placeholder: 'https://' },
        { key: 'country', label: 'Country', type: 'text', required: true, placeholder: 'e.g. Bangladesh' },
        { key: 'device', label: '\u09A1\u09BF\u09AD\u09BE\u0987\u09B8', type: 'radio', required: true, options: [
          { label: '\u09A1\u09C7\u09B8\u09CD\u0995\u099F\u09AA', value: 'desktop' },
          { label: '\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 (\u098F\u09A8\u09CD\u09A1\u09CD\u09B0\u09AF\u09BC\u09BF\u09A1)', value: 'android' },
          { label: '\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 (iPhone/iOS)', value: 'ios' },
          { label: '\u09AE\u09BF\u09B6\u09CD\u09B0 (\u09AE\u09CB\u09AC\u09BE\u0987\u09B2)', value: 'mixed_mobile' },
          { label: '\u09AE\u09BF\u09B6\u09CD\u09B0 (\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u0993 \u09A1\u09C7\u09B8\u09CD\u0995\u099F\u09AA)', value: 'mixed_all' },
        ]},
        { key: 'trafficType', label: '\u099F\u09CD\u09B0\u09BE\u09AB\u09BF\u0995\u09C7\u09B0 \u09A7\u09B0\u09A8', type: 'radio', required: true, options: [
          { label: 'Google \u0995\u09C0\u0989\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1', value: 'google_keyword' },
          { label: '\u0995\u09BE\u09B8\u09CD\u099F\u09AE \u09B0\u09BF\u09AB\u09BE\u09B0\u09BE\u09B0', value: 'custom_referrer' },
          { label: '\u09B0\u09BF\u09AB\u09BE\u09B0 \u099B\u09BE\u09A1\u09BC\u09BE', value: 'no_referrer' },
        ]},
        { key: 'keyword', label: 'Google \u0995\u09C0\u0989\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1', type: 'text', required: true, placeholder: 'Google Keyword...', showIf: { field: 'trafficType', equals: 'google_keyword' } },
        { key: 'referrerUrl', label: 'Referrer URL', type: 'url', required: true, placeholder: 'https://', showIf: { field: 'trafficType', equals: 'custom_referrer' } },
      ],
      'Spotify': [
        { key: 'link', label: 'Track/Playlist URL', type: 'url', required: true, placeholder: 'https://open.spotify.com/...' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '100' },
      ],
      'SoundCloud': [
        { key: 'link', label: 'Track URL', type: 'url', required: true, placeholder: 'https://soundcloud.com/...' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '100' },
      ],
      'LinkedIn': [
        { key: 'link', label: 'Post/Profile URL', type: 'url', required: true, placeholder: 'https://linkedin.com/...' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '100' },
      ],
      'SEO': [
        { key: 'link', label: 'Website URL', type: 'url', required: true, placeholder: 'https://yoursite.com' },
        { key: 'keyword', label: 'Target Keyword', type: 'text', required: true, placeholder: 'your keyword' },
        { key: 'country', label: 'Country', type: 'text', placeholder: 'Bangladesh', required: false },
      ],
      'Snapchat': [
        { key: 'username', label: 'Username', type: 'text', required: true, placeholder: '@username' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '100' },
      ],
      'Twitch': [
        { key: 'link', label: 'Channel/Stream URL', type: 'url', required: true, placeholder: 'https://twitch.tv/...' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '100' },
      ],
      'Discord': [
        { key: 'invite_link', label: 'Server Invite Link', type: 'url', required: true, placeholder: 'https://discord.gg/...' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '100' },
      ],
      'Other': [
        { key: 'link', label: 'Target Link', type: 'url', required: true, placeholder: 'https://...' },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '100' },
      ],
    };

    let changed = false;
    for (const [category, fields] of Object.entries(defaultOrderFields)) {
      if (catOrderFields[category] === undefined || catOrderFields[category] === null) {
        catOrderFields[category] = fields;
        changed = true;
      }
    }
    if (changed) {
      await SmmSettings.findOneAndUpdate(
        {},
        { $set: { categoryOrderFields: catOrderFields } },
        { upsert: true }
      );
    }

    for (const [category, fields] of Object.entries(catOrderFields)) {
      if (Array.isArray(fields) && fields.length > 0) {
        const catFilter = platform ? { category: platform, smmProvider: 'oneservicebd' } : { category, smmProvider: 'oneservicebd' };
        await Product.updateMany(catFilter, { $set: { orderFields: fields } });
      }
    }

    // Count all synced products so far (for per-platform sync, we need the cumulative count)
    const totalSynced = await Product.countDocuments({ smmProvider: 'oneservicebd' });

    // Update SmmSettings with fetched data
    const updateData: Record<string, unknown> = {
      balance: parseFloat(rawBalance),
      currency,
      categories,
      totalServices: services.length,
      syncedServices: totalSynced,
      syncStatus: 'success',
      lastErrorMessage: '',
    };
    if (!platform) {
      // Full sync: also store raw services list
      updateData.services = services;
    }

    await SmmSettings.findOneAndUpdate({}, { $set: updateData }, { upsert: true });

    return res.json(success({
      syncStatus: 'success',
      synced: filteredServices.length,
      categories: categories.length,
    }, platform
      ? `Synced ${filteredServices.length} "${platform}" services`
      : `Synced ${filteredServices.length} services across ${categories.length} categories`
    ));
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as Error)?.message || 'Unknown sync error';
    await SmmSettings.findOneAndUpdate(
      {},
      {
        $set: {
          syncStatus: 'error',
          lastErrorMessage: message,
        },
      },
      { upsert: true }
    );
    return res.status(502).json(error(`SMM sync failed: ${message}`));
  }
});

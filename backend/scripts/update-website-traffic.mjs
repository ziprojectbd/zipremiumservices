import mongoose from 'mongoose';
import env from '../src/config/env.js';

async function run() {
  await mongoose.connect(env.MONGODB_URI, { tls: true, tlsAllowInvalidCertificates: true });
  const db = mongoose.connection.db;
  const smmSettingsColl = db.collection('smmsettings');

  // Set Website Traffic orderFields in SmmSettings
  const fields = [
    { key: 'link', label: 'Website Link', type: 'url', required: true },
    { key: 'country', label: 'Country', type: 'select', required: true, options: ['US', 'UK', 'CA', 'DE'] },
    { key: 'device', label: 'Device', type: 'radio', options: ['Desktop', 'Android', 'iPhone', 'Mixed Mobile', 'Mixed'] },
    { key: 'trafficType', label: 'Traffic Type', type: 'radio', options: ['Google Keyword', 'Custom Referrer', 'No Referrer'] },
    { key: 'keyword', label: 'Google Keyword', type: 'text', showIf: { field: 'trafficType', equals: 'Google Keyword' } },
  ];

  const upd = await smmSettingsColl.updateOne(
    {},
    { $set: { 'categoryOrderFields.Website Traffic': fields } },
    { upsert: true }
  );
  console.log('SmmSettings updated:', upd.modifiedCount, 'upserted:', upd.upsertedCount);

  // Verify
  const settings = await smmSettingsColl.findOne({});
  const saved = settings?.categoryOrderFields?.['Website Traffic'];
  console.log('Saved fields:', JSON.stringify(saved, null, 2));

  await mongoose.disconnect();
  console.log('Done! Sync "Website Traffic" from Admin panel to apply to products.');
}

run().catch(err => { console.error(err); process.exit(1); });

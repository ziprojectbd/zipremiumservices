import mongoose from 'mongoose';
const mobilePaymentSchema = new mongoose.Schema({
    method: { type: String, required: true },
    number: { type: String, required: true },
    numberType: { type: String, enum: ['personal', 'agent', 'merchant'], required: true },
    merchantName: { type: String, default: '' },
    instructions: { type: String, default: '' },
    warningInstructions: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
}, { _id: true });
const cryptoPaymentSchema = new mongoose.Schema({
    currency: { type: String, required: true },
    payType: { type: String, enum: ['network', 'uid'], required: true },
    network: { type: String, default: '' },
    platform: { type: String, default: '' },
    address: { type: String, default: '' },
    uid: { type: String, default: '' },
    exchangeUid: { type: String, default: '' },
    notes: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
}, { _id: true });
const paymentSettingsSchema = new mongoose.Schema({
    minOrderAmount: { type: String, default: '' },
    maxOrderAmount: { type: String, default: '' },
    defaultCurrency: { type: String, default: 'BDT' },
    exchangeRate: { type: Number, default: 110 },
    mobilePayments: { type: [mobilePaymentSchema], default: [] },
    cryptoPayments: { type: [cryptoPaymentSchema], default: [] },
    customCurrencies: { type: [String], default: [] },
    customNetworks: { type: [String], default: [] },
    customPlatforms: { type: [String], default: [] },
}, {
    timestamps: true,
});
const PaymentSettings = mongoose.models.PaymentSettings || mongoose.model('PaymentSettings', paymentSettingsSchema);
export default PaymentSettings;
//# sourceMappingURL=PaymentSettings.js.map
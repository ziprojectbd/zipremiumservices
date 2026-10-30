import mongoose from 'mongoose';

export interface IMobilePayment {
  method: string;
  number: string;
  numberType: 'personal' | 'agent' | 'merchant';
  merchantName: string;
  instructions: string;
  warningInstructions: string;
  enabled: boolean;
}

export interface ICryptoPayment {
  currency: string;
  payType: 'network' | 'uid';
  network?: string;
  platform?: string;
  address?: string;
  uid?: string;
  exchangeUid?: string;
  notes?: string;
  enabled: boolean;
}

export interface IPaymentSettings {
  _id: mongoose.Types.ObjectId;
  minOrderAmount: string;
  maxOrderAmount: string;
  defaultCurrency: string;
  exchangeRate: number;
  mobilePayments: IMobilePayment[];
  cryptoPayments: ICryptoPayment[];
  customCurrencies: string[];
  customNetworks: string[];
  customPlatforms: string[];
  createdAt: Date;
  updatedAt: Date;
}

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

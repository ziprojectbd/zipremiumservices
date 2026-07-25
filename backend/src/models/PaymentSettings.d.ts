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
declare const PaymentSettings: mongoose.Model<any, {}, {}, {}, any, any, any>;
export default PaymentSettings;
//# sourceMappingURL=PaymentSettings.d.ts.map
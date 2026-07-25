/**
 * Supported payment methods for the Order model.
 * The enum in the Order schema uses this as its source of truth.
 * Add new mobile payment methods here when they need enum-level validation.
 */
export declare const PAYMENT_METHODS: readonly ['bkash', 'nagad', 'rocket', 'upay', 'tap', 'cod', 'paycrypto'];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
/** Methods that go through the mobile-payment flow (require payment number + transaction ID) */
export declare const MOBILE_PAYMENT_METHODS: ("bkash" | "nagad" | "rocket" | "tap" | "upay")[];
/** Method identifier for crypto payments */
export declare const CRYPTO_PAYMENT_METHOD: 'paycrypto';
//# sourceMappingURL=constants.d.ts.map
/**
 * Supported payment methods for the Order model.
 * The enum in the Order schema uses this as its source of truth.
 * Add new mobile payment methods here when they need enum-level validation.
 */
export const PAYMENT_METHODS = [
    'bkash',
    'nagad',
    'rocket',
    'upay',
    'tap',
    'cod',
    'paycrypto',
];
/** Methods that go through the mobile-payment flow (require payment number + transaction ID) */
export const MOBILE_PAYMENT_METHODS = PAYMENT_METHODS.filter((m) => m !== 'paycrypto' && m !== 'cod');
/** Method identifier for crypto payments */
export const CRYPTO_PAYMENT_METHOD = 'paycrypto';
//# sourceMappingURL=constants.js.map
export declare function sendTelegramNotification(chatId: string, text: string): Promise<boolean>;
export declare function formatDeliveryNotification(order: {
    orderNumber: string;
    email: string;
    username?: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    items?: Array<{
        productName?: string;
        quantity: number;
        price: number;
        link?: string;
        smmServiceId?: string;
        smmOrderId?: string;
        smmProvider?: string;
    }>;
    createdAt?: string;
    deliveryNote?: string;
}): string;
export declare function formatOrderNotification(order: {
    orderNumber: string;
    email: string;
    username?: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    status: string;
    items?: Array<{
        productName?: string;
        quantity: number;
        price: number;
        link?: string;
        smmServiceId?: string;
        smmProvider?: string;
    }>;
    createdAt?: string;
}): string;
//# sourceMappingURL=telegram.d.ts.map
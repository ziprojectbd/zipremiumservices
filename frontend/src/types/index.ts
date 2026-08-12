export interface OrderFieldValidation {
    min?: number;
    max?: number;
    pattern?: string;
}

export interface OrderFieldShowIf {
    field?: string;
    equals?: string;
}

export interface OrderFieldOption {
    label: string;
    value: string;
}

export interface OrderField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'url' | 'email' | 'select' | 'radio' | 'checkbox' | 'date' | 'time' | 'password' | 'hidden';
    placeholder?: string;
    required?: boolean;
    options?: string[] | OrderFieldOption[];
    defaultValue?: any;
    validation?: OrderFieldValidation;
    showIf?: OrderFieldShowIf;
}

export interface Product {
    id: number | string;
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    priceBDT?: number;
    priceUSDT?: number;
    category: string;
    icon?: React.ReactNode;
    features: string[];
    imageUrl?: string;
    images?: string[];
    stock?: number;
    available?: boolean;
    showStock?: boolean;
    showImageSlider?: boolean;
    dbId?: string;
    seoSlug?: string;
    details?: string;
    smmProvider?: string;
    smmServiceId?: string;
    smmMin?: number;
    smmMax?: number;
    productType?: 'standard' | 'smm' | 'captchamaster';
    captchamasterPlanId?: string;
    orderFields?: OrderField[];
    campaignPrice?: number;
    campaignDiscount?: number;
    campaignAmountSaved?: number;
    campaignBadge?: string;
    campaignSlug?: string;
    campaignColor?: string;
    campaignDiscountType?: string;
    campaignEndDate?: string;
    campaignTotalStock?: number;
    campaignUsedStock?: number;
}

export interface CampaignData {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    bannerImage?: string;
    mobileBanner?: string;
    campaignLogo?: string;
    colorTheme: string;
    status: 'draft' | 'scheduled' | 'active' | 'expired';
    priority: number;
    startDate?: string;
    endDate?: string;
    discountType: string;
    discountValue: number;
    couponCode?: string;
    targetType: string;
    isActive: boolean;
    isFeatured: boolean;
    totalStock: number;
    usedStock: number;
    remainingStock?: number;
    isRunning?: boolean;
    timeRemaining?: number | null;
}

export interface CartItem extends Product {
    quantity: number;
    link?: string;
    customData?: Record<string, any>;
}

export interface Order {
    id: string;
    date: string;
    status: "pending" | "processing" | "completed" | "cancelled";
    total: number;
    items: (CartItem & { customData?: Record<string, any> })[];
    paymentMethod: string;
    trxId: string;
    payerNumber: string;
    txHash?: string;
    walletAddress?: string;
    orderNumber?: string;
    email?: string;
    paymentStatus?: string;
    transactionId?: string;
    paymentNumber?: string;
    paidVia?: string;
    selectedNetwork?: string;
    selectedPlatform?: string;
    senderUid?: string;
    cryptoCurrency?: string;
    currency?: string;
    captchaApiKey?: string | null;
    p2pToken?: string;
    p2pNetwork?: string;
    p2pWalletAddress?: string;
    couponCode?: string;
    discountAmount?: number;
    discountType?: string;
    deliveryNote?: string;
    delivery?: {
        provider?: string;
        status?: 'pending' | 'completed' | 'failed' | '';
        externalReference?: string;
        errorMessage?: string;
        deliveredAt?: string;
    };
}

export interface ShopProduct {
    id: number | string;
    name: string;
    description: string;
    price: number;
    priceBDT?: number;
    priceUSDT?: number;
    originalPrice: number;
    category: string;
    icon?: React.ReactNode;
    features: string[];
    rating?: number;
    reviews?: number | string;
    imageUrl?: string;
    images?: string[];
    stock?: number;
    available?: boolean;
    showStock?: boolean;
    showImageSlider?: boolean;
    dbId?: string;
    seoSlug?: string;
    details?: string;
    smmProvider?: string;
    smmServiceId?: string;
    smmMin?: number;
    smmMax?: number;
    orderFields?: OrderField[];
    campaignPrice?: number;
    campaignDiscount?: number;
    campaignAmountSaved?: number;
    campaignBadge?: string;
    campaignSlug?: string;
    campaignColor?: string;
    campaignDiscountType?: string;
    campaignEndDate?: string;
    campaignTotalStock?: number;
    campaignUsedStock?: number;
}

export interface Airdrop {
    id: number;
    title: string;
    description: string;
    reward: string;
    participants: string;
    timeLeft: string;
    type: string;
    color: string;
    status: "live" | "ended" | "upcoming";
}

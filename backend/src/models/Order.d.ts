import mongoose from 'mongoose';
declare const _default: mongoose.Model<{
    orderNumber?: string | null;
    customer?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
        default: null;
    };
    customerEmail?: string | null;
    email: string;
    username?: string | null;
    customerWallet?: string | null;
    product?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productName?: string | null;
    productCategory?: string | null;
    amount: number;
    currency: "BDT" | "USDT";
    status: "approved" | "delivered" | "pending" | "rejected";
    paymentMethod: string;
    source: "admin" | "checkout";
    txHash: string;
    paymentNumber: string;
    transactionId: string;
    cryptoCurrency: string;
    paidVia: "" | "network" | "uid";
    selectedNetwork: string;
    selectedPlatform: string;
    walletAddress: string;
    senderUid: string;
    p2pToken?: string | null;
    p2pNetwork?: string | null;
    p2pWalletAddress?: string | null;
    paymentStatus: "pending" | "rejected" | "verified";
    couponCode?: string | null;
    discountAmount?: number | null;
    discountType?: string | null;
    deliveryNote?: string | null;
    ipAddress?: string | null;
    country?: string | null;
    countryCode?: string | null;
    countryFlag?: string | null;
    items: mongoose.Types.DocumentArray<{
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, {}, {}> & {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }>;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    orderNumber?: string | null;
    customer?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
        default: null;
    };
    customerEmail?: string | null;
    email: string;
    username?: string | null;
    customerWallet?: string | null;
    product?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productName?: string | null;
    productCategory?: string | null;
    amount: number;
    currency: "BDT" | "USDT";
    status: "approved" | "delivered" | "pending" | "rejected";
    paymentMethod: string;
    source: "admin" | "checkout";
    txHash: string;
    paymentNumber: string;
    transactionId: string;
    cryptoCurrency: string;
    paidVia: "" | "network" | "uid";
    selectedNetwork: string;
    selectedPlatform: string;
    walletAddress: string;
    senderUid: string;
    p2pToken?: string | null;
    p2pNetwork?: string | null;
    p2pWalletAddress?: string | null;
    paymentStatus: "pending" | "rejected" | "verified";
    couponCode?: string | null;
    discountAmount?: number | null;
    discountType?: string | null;
    deliveryNote?: string | null;
    ipAddress?: string | null;
    country?: string | null;
    countryCode?: string | null;
    countryFlag?: string | null;
    items: mongoose.Types.DocumentArray<{
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, {}, {}> & {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }>;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    orderNumber?: string | null;
    customer?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
        default: null;
    };
    customerEmail?: string | null;
    email: string;
    username?: string | null;
    customerWallet?: string | null;
    product?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productName?: string | null;
    productCategory?: string | null;
    amount: number;
    currency: "BDT" | "USDT";
    status: "approved" | "delivered" | "pending" | "rejected";
    paymentMethod: string;
    source: "admin" | "checkout";
    txHash: string;
    paymentNumber: string;
    transactionId: string;
    cryptoCurrency: string;
    paidVia: "" | "network" | "uid";
    selectedNetwork: string;
    selectedPlatform: string;
    walletAddress: string;
    senderUid: string;
    p2pToken?: string | null;
    p2pNetwork?: string | null;
    p2pWalletAddress?: string | null;
    paymentStatus: "pending" | "rejected" | "verified";
    couponCode?: string | null;
    discountAmount?: number | null;
    discountType?: string | null;
    deliveryNote?: string | null;
    ipAddress?: string | null;
    country?: string | null;
    countryCode?: string | null;
    countryFlag?: string | null;
    items: mongoose.Types.DocumentArray<{
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, {}, {}> & {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }>;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    orderNumber?: string | null;
    customer?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
        default: null;
    };
    customerEmail?: string | null;
    email: string;
    username?: string | null;
    customerWallet?: string | null;
    product?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productName?: string | null;
    productCategory?: string | null;
    amount: number;
    currency: "BDT" | "USDT";
    status: "approved" | "delivered" | "pending" | "rejected";
    paymentMethod: string;
    source: "admin" | "checkout";
    txHash: string;
    paymentNumber: string;
    transactionId: string;
    cryptoCurrency: string;
    paidVia: "" | "network" | "uid";
    selectedNetwork: string;
    selectedPlatform: string;
    walletAddress: string;
    senderUid: string;
    p2pToken?: string | null;
    p2pNetwork?: string | null;
    p2pWalletAddress?: string | null;
    paymentStatus: "pending" | "rejected" | "verified";
    couponCode?: string | null;
    discountAmount?: number | null;
    discountType?: string | null;
    deliveryNote?: string | null;
    ipAddress?: string | null;
    country?: string | null;
    countryCode?: string | null;
    countryFlag?: string | null;
    items: mongoose.Types.DocumentArray<{
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, {}, {}> & {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }>;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    orderNumber?: string | null;
    customer?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
        default: null;
    };
    customerEmail?: string | null;
    email: string;
    username?: string | null;
    customerWallet?: string | null;
    product?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productName?: string | null;
    productCategory?: string | null;
    amount: number;
    currency: "BDT" | "USDT";
    status: "approved" | "delivered" | "pending" | "rejected";
    paymentMethod: string;
    source: "admin" | "checkout";
    txHash: string;
    paymentNumber: string;
    transactionId: string;
    cryptoCurrency: string;
    paidVia: "" | "network" | "uid";
    selectedNetwork: string;
    selectedPlatform: string;
    walletAddress: string;
    senderUid: string;
    p2pToken?: string | null;
    p2pNetwork?: string | null;
    p2pWalletAddress?: string | null;
    paymentStatus: "pending" | "rejected" | "verified";
    couponCode?: string | null;
    discountAmount?: number | null;
    discountType?: string | null;
    deliveryNote?: string | null;
    ipAddress?: string | null;
    country?: string | null;
    countryCode?: string | null;
    countryFlag?: string | null;
    items: mongoose.Types.DocumentArray<{
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, {}, {}> & {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }>;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    orderNumber?: string | null;
    customer?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
        default: null;
    };
    customerEmail?: string | null;
    email: string;
    username?: string | null;
    customerWallet?: string | null;
    product?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productName?: string | null;
    productCategory?: string | null;
    amount: number;
    currency: "BDT" | "USDT";
    status: "approved" | "delivered" | "pending" | "rejected";
    paymentMethod: string;
    source: "admin" | "checkout";
    txHash: string;
    paymentNumber: string;
    transactionId: string;
    cryptoCurrency: string;
    paidVia: "" | "network" | "uid";
    selectedNetwork: string;
    selectedPlatform: string;
    walletAddress: string;
    senderUid: string;
    p2pToken?: string | null;
    p2pNetwork?: string | null;
    p2pWalletAddress?: string | null;
    paymentStatus: "pending" | "rejected" | "verified";
    couponCode?: string | null;
    discountAmount?: number | null;
    discountType?: string | null;
    deliveryNote?: string | null;
    ipAddress?: string | null;
    country?: string | null;
    countryCode?: string | null;
    countryFlag?: string | null;
    items: mongoose.Types.DocumentArray<{
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, {}, {}> & {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }>;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, unknown, mongoose.FlattenMaps<{
    orderNumber?: string | null;
    customer?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
        default: null;
    };
    customerEmail?: string | null;
    email: string;
    username?: string | null;
    customerWallet?: string | null;
    product?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productName?: string | null;
    productCategory?: string | null;
    amount: number;
    currency: "BDT" | "USDT";
    status: "approved" | "delivered" | "pending" | "rejected";
    paymentMethod: string;
    source: "admin" | "checkout";
    txHash: string;
    paymentNumber: string;
    transactionId: string;
    cryptoCurrency: string;
    paidVia: "" | "network" | "uid";
    selectedNetwork: string;
    selectedPlatform: string;
    walletAddress: string;
    senderUid: string;
    p2pToken?: string | null;
    p2pNetwork?: string | null;
    p2pWalletAddress?: string | null;
    paymentStatus: "pending" | "rejected" | "verified";
    couponCode?: string | null;
    discountAmount?: number | null;
    discountType?: string | null;
    deliveryNote?: string | null;
    ipAddress?: string | null;
    country?: string | null;
    countryCode?: string | null;
    countryFlag?: string | null;
    items: mongoose.Types.DocumentArray<{
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, {}, {}> & {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }>;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, mongoose.FlattenMaps<{
    orderNumber?: string | null;
    customer?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
        default: null;
    };
    customerEmail?: string | null;
    email: string;
    username?: string | null;
    customerWallet?: string | null;
    product?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    productName?: string | null;
    productCategory?: string | null;
    amount: number;
    currency: "BDT" | "USDT";
    status: "approved" | "delivered" | "pending" | "rejected";
    paymentMethod: string;
    source: "admin" | "checkout";
    txHash: string;
    paymentNumber: string;
    transactionId: string;
    cryptoCurrency: string;
    paidVia: "" | "network" | "uid";
    selectedNetwork: string;
    selectedPlatform: string;
    walletAddress: string;
    senderUid: string;
    p2pToken?: string | null;
    p2pNetwork?: string | null;
    p2pWalletAddress?: string | null;
    paymentStatus: "pending" | "rejected" | "verified";
    couponCode?: string | null;
    discountAmount?: number | null;
    discountType?: string | null;
    deliveryNote?: string | null;
    ipAddress?: string | null;
    country?: string | null;
    countryCode?: string | null;
    countryFlag?: string | null;
    items: mongoose.Types.DocumentArray<{
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }, {}, {}> & {
        product?: {
            type: typeof mongoose.Schema.Types.ObjectId;
            ref: string;
            required: boolean;
        };
        quantity: number;
        price: number;
        usdtAmount: number;
        productName?: string | null;
        category?: string | null;
        link?: string | null;
        smmServiceId?: string | null;
        smmProvider?: string | null;
        smmOrderId?: string | null;
        details?: string | null;
        customData?: {
            type: typeof mongoose.Schema.Types.Mixed;
            required: boolean;
            default: {};
        };
    }>;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default _default;
//# sourceMappingURL=Order.d.ts.map
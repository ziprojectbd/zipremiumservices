import mongoose from 'mongoose';
declare const _default: mongoose.Model<{
    orderNumber: string;
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
    };
    buyerEmail: string;
    buyerName: string;
    sellerEmail: string;
    sellerName: string;
    amount: number;
    paymentMethod: string;
    paymentNumber: string;
    transactionId: string;
    status: "approved" | "cancelled" | "completed" | "disputed" | "paid" | "pending" | "rejected";
    notes: string;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    orderNumber: string;
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
    };
    buyerEmail: string;
    buyerName: string;
    sellerEmail: string;
    sellerName: string;
    amount: number;
    paymentMethod: string;
    paymentNumber: string;
    transactionId: string;
    status: "approved" | "cancelled" | "completed" | "disputed" | "paid" | "pending" | "rejected";
    notes: string;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    orderNumber: string;
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
    };
    buyerEmail: string;
    buyerName: string;
    sellerEmail: string;
    sellerName: string;
    amount: number;
    paymentMethod: string;
    paymentNumber: string;
    transactionId: string;
    status: "approved" | "cancelled" | "completed" | "disputed" | "paid" | "pending" | "rejected";
    notes: string;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    orderNumber: string;
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
    };
    buyerEmail: string;
    buyerName: string;
    sellerEmail: string;
    sellerName: string;
    amount: number;
    paymentMethod: string;
    paymentNumber: string;
    transactionId: string;
    status: "approved" | "cancelled" | "completed" | "disputed" | "paid" | "pending" | "rejected";
    notes: string;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    orderNumber: string;
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
    };
    buyerEmail: string;
    buyerName: string;
    sellerEmail: string;
    sellerName: string;
    amount: number;
    paymentMethod: string;
    paymentNumber: string;
    transactionId: string;
    status: "approved" | "cancelled" | "completed" | "disputed" | "paid" | "pending" | "rejected";
    notes: string;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    orderNumber: string;
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
    };
    buyerEmail: string;
    buyerName: string;
    sellerEmail: string;
    sellerName: string;
    amount: number;
    paymentMethod: string;
    paymentNumber: string;
    transactionId: string;
    status: "approved" | "cancelled" | "completed" | "disputed" | "paid" | "pending" | "rejected";
    notes: string;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, unknown, mongoose.FlattenMaps<{
    orderNumber: string;
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
    };
    buyerEmail: string;
    buyerName: string;
    sellerEmail: string;
    sellerName: string;
    amount: number;
    paymentMethod: string;
    paymentNumber: string;
    transactionId: string;
    status: "approved" | "cancelled" | "completed" | "disputed" | "paid" | "pending" | "rejected";
    notes: string;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, mongoose.FlattenMaps<{
    orderNumber: string;
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidId?: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
    };
    buyerEmail: string;
    buyerName: string;
    sellerEmail: string;
    sellerName: string;
    amount: number;
    paymentMethod: string;
    paymentNumber: string;
    transactionId: string;
    status: "approved" | "cancelled" | "completed" | "disputed" | "paid" | "pending" | "rejected";
    notes: string;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default _default;
//# sourceMappingURL=TraderOrder.d.ts.map
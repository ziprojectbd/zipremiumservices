import mongoose from 'mongoose';
declare const _default: mongoose.Model<{
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidderEmail: string;
    bidderName: string;
    amount: number;
    message: string;
    status: "accepted" | "pending" | "rejected";
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidderEmail: string;
    bidderName: string;
    amount: number;
    message: string;
    status: "accepted" | "pending" | "rejected";
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidderEmail: string;
    bidderName: string;
    amount: number;
    message: string;
    status: "accepted" | "pending" | "rejected";
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidderEmail: string;
    bidderName: string;
    amount: number;
    message: string;
    status: "accepted" | "pending" | "rejected";
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidderEmail: string;
    bidderName: string;
    amount: number;
    message: string;
    status: "accepted" | "pending" | "rejected";
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidderEmail: string;
    bidderName: string;
    amount: number;
    message: string;
    status: "accepted" | "pending" | "rejected";
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, unknown, mongoose.FlattenMaps<{
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidderEmail: string;
    bidderName: string;
    amount: number;
    message: string;
    status: "accepted" | "pending" | "rejected";
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, mongoose.FlattenMaps<{
    listingId: {
        type: typeof mongoose.Schema.Types.ObjectId;
        ref: string;
        required: boolean;
    };
    bidderEmail: string;
    bidderName: string;
    amount: number;
    message: string;
    status: "accepted" | "pending" | "rejected";
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default _default;
//# sourceMappingURL=TraderBid.d.ts.map
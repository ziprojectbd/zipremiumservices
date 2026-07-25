import mongoose from 'mongoose';
declare const _default: mongoose.Model<{
    code: string;
    discountType: "flat" | "percentage";
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number;
    usageLimit: number;
    usedCount: number;
    isActive: {
        type: BooleanConstructor;
        default: boolean;
    };
    expiresAt?: NativeDate | null;
    applicableCategories: string[];
    applicableProducts: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    usedBy: mongoose.Types.DocumentArray<{
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, {}, {}> & {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }>;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    code: string;
    discountType: "flat" | "percentage";
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number;
    usageLimit: number;
    usedCount: number;
    isActive: {
        type: BooleanConstructor;
        default: boolean;
    };
    expiresAt?: NativeDate | null;
    applicableCategories: string[];
    applicableProducts: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    usedBy: mongoose.Types.DocumentArray<{
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, {}, {}> & {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }>;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    code: string;
    discountType: "flat" | "percentage";
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number;
    usageLimit: number;
    usedCount: number;
    isActive: {
        type: BooleanConstructor;
        default: boolean;
    };
    expiresAt?: NativeDate | null;
    applicableCategories: string[];
    applicableProducts: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    usedBy: mongoose.Types.DocumentArray<{
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, {}, {}> & {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
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
    code: string;
    discountType: "flat" | "percentage";
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number;
    usageLimit: number;
    usedCount: number;
    isActive: {
        type: BooleanConstructor;
        default: boolean;
    };
    expiresAt?: NativeDate | null;
    applicableCategories: string[];
    applicableProducts: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    usedBy: mongoose.Types.DocumentArray<{
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, {}, {}> & {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }>;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    code: string;
    discountType: "flat" | "percentage";
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number;
    usageLimit: number;
    usedCount: number;
    isActive: {
        type: BooleanConstructor;
        default: boolean;
    };
    expiresAt?: NativeDate | null;
    applicableCategories: string[];
    applicableProducts: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    usedBy: mongoose.Types.DocumentArray<{
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, {}, {}> & {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }>;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    code: string;
    discountType: "flat" | "percentage";
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number;
    usageLimit: number;
    usedCount: number;
    isActive: {
        type: BooleanConstructor;
        default: boolean;
    };
    expiresAt?: NativeDate | null;
    applicableCategories: string[];
    applicableProducts: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    usedBy: mongoose.Types.DocumentArray<{
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, {}, {}> & {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }>;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, unknown, mongoose.FlattenMaps<{
    code: string;
    discountType: "flat" | "percentage";
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number;
    usageLimit: number;
    usedCount: number;
    isActive: {
        type: BooleanConstructor;
        default: boolean;
    };
    expiresAt?: NativeDate | null;
    applicableCategories: string[];
    applicableProducts: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    usedBy: mongoose.Types.DocumentArray<{
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, {}, {}> & {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }>;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, mongoose.FlattenMaps<{
    code: string;
    discountType: "flat" | "percentage";
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number;
    usageLimit: number;
    usedCount: number;
    isActive: {
        type: BooleanConstructor;
        default: boolean;
    };
    expiresAt?: NativeDate | null;
    applicableCategories: string[];
    applicableProducts: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'ObjectId';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    usedBy: mongoose.Types.DocumentArray<{
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }, {}, {}> & {
        email: string;
        productId: {
            type: typeof mongoose.Schema.Types.ObjectId;
            required: boolean;
        };
    }>;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default _default;
//# sourceMappingURL=Coupon.d.ts.map
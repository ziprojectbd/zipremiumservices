import mongoose from 'mongoose';
declare const _default: mongoose.Model<{
    markupPercent: number;
    lastSyncAt?: NativeDate | null;
    lastSyncCount: number;
    syncStatus: "error" | "idle" | "success" | "syncing";
    lastErrorMessage: string;
    defaultCategory: string;
    autoSyncEnabled: {
        type: BooleanConstructor;
        default: boolean;
    };
    categoryOverrides: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    enabledCategories: string[];
    platformImages: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    categoryOrderFields: {
        type: MapConstructor;
        of: {
            key: {
                type: StringConstructor;
                required: true;
            };
            label: {
                type: StringConstructor;
                required: true;
            };
            type: {
                type: StringConstructor;
                enum: string[];
                default: string;
            };
            placeholder: {
                type: StringConstructor;
            };
            required: {
                type: BooleanConstructor;
                default: boolean;
            };
            options: {
                type: (typeof mongoose.Schema.Types.Mixed)[];
                default: undefined;
            };
            defaultValue: {
                type: typeof mongoose.Schema.Types.Mixed;
            };
            validation: {
                type: {
                    min: {
                        type: NumberConstructor;
                    };
                    max: {
                        type: NumberConstructor;
                    };
                    pattern: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
            showIf: {
                type: {
                    field: {
                        type: StringConstructor;
                    };
                    equals: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
        }[];
        default: {};
    };
    balance: number;
    currency: string;
    services: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    categories: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    totalServices: number;
    syncedServices: number;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    markupPercent: number;
    lastSyncAt?: NativeDate | null;
    lastSyncCount: number;
    syncStatus: "error" | "idle" | "success" | "syncing";
    lastErrorMessage: string;
    defaultCategory: string;
    autoSyncEnabled: {
        type: BooleanConstructor;
        default: boolean;
    };
    categoryOverrides: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    enabledCategories: string[];
    platformImages: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    categoryOrderFields: {
        type: MapConstructor;
        of: {
            key: {
                type: StringConstructor;
                required: true;
            };
            label: {
                type: StringConstructor;
                required: true;
            };
            type: {
                type: StringConstructor;
                enum: string[];
                default: string;
            };
            placeholder: {
                type: StringConstructor;
            };
            required: {
                type: BooleanConstructor;
                default: boolean;
            };
            options: {
                type: (typeof mongoose.Schema.Types.Mixed)[];
                default: undefined;
            };
            defaultValue: {
                type: typeof mongoose.Schema.Types.Mixed;
            };
            validation: {
                type: {
                    min: {
                        type: NumberConstructor;
                    };
                    max: {
                        type: NumberConstructor;
                    };
                    pattern: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
            showIf: {
                type: {
                    field: {
                        type: StringConstructor;
                    };
                    equals: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
        }[];
        default: {};
    };
    balance: number;
    currency: string;
    services: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    categories: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    totalServices: number;
    syncedServices: number;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    markupPercent: number;
    lastSyncAt?: NativeDate | null;
    lastSyncCount: number;
    syncStatus: "error" | "idle" | "success" | "syncing";
    lastErrorMessage: string;
    defaultCategory: string;
    autoSyncEnabled: {
        type: BooleanConstructor;
        default: boolean;
    };
    categoryOverrides: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    enabledCategories: string[];
    platformImages: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    categoryOrderFields: {
        type: MapConstructor;
        of: {
            key: {
                type: StringConstructor;
                required: true;
            };
            label: {
                type: StringConstructor;
                required: true;
            };
            type: {
                type: StringConstructor;
                enum: string[];
                default: string;
            };
            placeholder: {
                type: StringConstructor;
            };
            required: {
                type: BooleanConstructor;
                default: boolean;
            };
            options: {
                type: (typeof mongoose.Schema.Types.Mixed)[];
                default: undefined;
            };
            defaultValue: {
                type: typeof mongoose.Schema.Types.Mixed;
            };
            validation: {
                type: {
                    min: {
                        type: NumberConstructor;
                    };
                    max: {
                        type: NumberConstructor;
                    };
                    pattern: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
            showIf: {
                type: {
                    field: {
                        type: StringConstructor;
                    };
                    equals: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
        }[];
        default: {};
    };
    balance: number;
    currency: string;
    services: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    categories: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    totalServices: number;
    syncedServices: number;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    markupPercent: number;
    lastSyncAt?: NativeDate | null;
    lastSyncCount: number;
    syncStatus: "error" | "idle" | "success" | "syncing";
    lastErrorMessage: string;
    defaultCategory: string;
    autoSyncEnabled: {
        type: BooleanConstructor;
        default: boolean;
    };
    categoryOverrides: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    enabledCategories: string[];
    platformImages: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    categoryOrderFields: {
        type: MapConstructor;
        of: {
            key: {
                type: StringConstructor;
                required: true;
            };
            label: {
                type: StringConstructor;
                required: true;
            };
            type: {
                type: StringConstructor;
                enum: string[];
                default: string;
            };
            placeholder: {
                type: StringConstructor;
            };
            required: {
                type: BooleanConstructor;
                default: boolean;
            };
            options: {
                type: (typeof mongoose.Schema.Types.Mixed)[];
                default: undefined;
            };
            defaultValue: {
                type: typeof mongoose.Schema.Types.Mixed;
            };
            validation: {
                type: {
                    min: {
                        type: NumberConstructor;
                    };
                    max: {
                        type: NumberConstructor;
                    };
                    pattern: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
            showIf: {
                type: {
                    field: {
                        type: StringConstructor;
                    };
                    equals: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
        }[];
        default: {};
    };
    balance: number;
    currency: string;
    services: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    categories: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    totalServices: number;
    syncedServices: number;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    markupPercent: number;
    lastSyncAt?: NativeDate | null;
    lastSyncCount: number;
    syncStatus: "error" | "idle" | "success" | "syncing";
    lastErrorMessage: string;
    defaultCategory: string;
    autoSyncEnabled: {
        type: BooleanConstructor;
        default: boolean;
    };
    categoryOverrides: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    enabledCategories: string[];
    platformImages: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    categoryOrderFields: {
        type: MapConstructor;
        of: {
            key: {
                type: StringConstructor;
                required: true;
            };
            label: {
                type: StringConstructor;
                required: true;
            };
            type: {
                type: StringConstructor;
                enum: string[];
                default: string;
            };
            placeholder: {
                type: StringConstructor;
            };
            required: {
                type: BooleanConstructor;
                default: boolean;
            };
            options: {
                type: (typeof mongoose.Schema.Types.Mixed)[];
                default: undefined;
            };
            defaultValue: {
                type: typeof mongoose.Schema.Types.Mixed;
            };
            validation: {
                type: {
                    min: {
                        type: NumberConstructor;
                    };
                    max: {
                        type: NumberConstructor;
                    };
                    pattern: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
            showIf: {
                type: {
                    field: {
                        type: StringConstructor;
                    };
                    equals: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
        }[];
        default: {};
    };
    balance: number;
    currency: string;
    services: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    categories: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    totalServices: number;
    syncedServices: number;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    markupPercent: number;
    lastSyncAt?: NativeDate | null;
    lastSyncCount: number;
    syncStatus: "error" | "idle" | "success" | "syncing";
    lastErrorMessage: string;
    defaultCategory: string;
    autoSyncEnabled: {
        type: BooleanConstructor;
        default: boolean;
    };
    categoryOverrides: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    enabledCategories: string[];
    platformImages: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    categoryOrderFields: {
        type: MapConstructor;
        of: {
            key: {
                type: StringConstructor;
                required: true;
            };
            label: {
                type: StringConstructor;
                required: true;
            };
            type: {
                type: StringConstructor;
                enum: string[];
                default: string;
            };
            placeholder: {
                type: StringConstructor;
            };
            required: {
                type: BooleanConstructor;
                default: boolean;
            };
            options: {
                type: (typeof mongoose.Schema.Types.Mixed)[];
                default: undefined;
            };
            defaultValue: {
                type: typeof mongoose.Schema.Types.Mixed;
            };
            validation: {
                type: {
                    min: {
                        type: NumberConstructor;
                    };
                    max: {
                        type: NumberConstructor;
                    };
                    pattern: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
            showIf: {
                type: {
                    field: {
                        type: StringConstructor;
                    };
                    equals: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
        }[];
        default: {};
    };
    balance: number;
    currency: string;
    services: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    categories: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    totalServices: number;
    syncedServices: number;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, unknown, mongoose.FlattenMaps<{
    markupPercent: number;
    lastSyncAt?: NativeDate | null;
    lastSyncCount: number;
    syncStatus: "error" | "idle" | "success" | "syncing";
    lastErrorMessage: string;
    defaultCategory: string;
    autoSyncEnabled: {
        type: BooleanConstructor;
        default: boolean;
    };
    categoryOverrides: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    enabledCategories: string[];
    platformImages: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    categoryOrderFields: {
        type: MapConstructor;
        of: {
            key: {
                type: StringConstructor;
                required: true;
            };
            label: {
                type: StringConstructor;
                required: true;
            };
            type: {
                type: StringConstructor;
                enum: string[];
                default: string;
            };
            placeholder: {
                type: StringConstructor;
            };
            required: {
                type: BooleanConstructor;
                default: boolean;
            };
            options: {
                type: (typeof mongoose.Schema.Types.Mixed)[];
                default: undefined;
            };
            defaultValue: {
                type: typeof mongoose.Schema.Types.Mixed;
            };
            validation: {
                type: {
                    min: {
                        type: NumberConstructor;
                    };
                    max: {
                        type: NumberConstructor;
                    };
                    pattern: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
            showIf: {
                type: {
                    field: {
                        type: StringConstructor;
                    };
                    equals: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
        }[];
        default: {};
    };
    balance: number;
    currency: string;
    services: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    categories: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    totalServices: number;
    syncedServices: number;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, mongoose.FlattenMaps<{
    markupPercent: number;
    lastSyncAt?: NativeDate | null;
    lastSyncCount: number;
    syncStatus: "error" | "idle" | "success" | "syncing";
    lastErrorMessage: string;
    defaultCategory: string;
    autoSyncEnabled: {
        type: BooleanConstructor;
        default: boolean;
    };
    categoryOverrides: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    enabledCategories: string[];
    platformImages: {
        type: MapConstructor;
        of: StringConstructor;
        default: {};
    };
    categoryOrderFields: {
        type: MapConstructor;
        of: {
            key: {
                type: StringConstructor;
                required: true;
            };
            label: {
                type: StringConstructor;
                required: true;
            };
            type: {
                type: StringConstructor;
                enum: string[];
                default: string;
            };
            placeholder: {
                type: StringConstructor;
            };
            required: {
                type: BooleanConstructor;
                default: boolean;
            };
            options: {
                type: (typeof mongoose.Schema.Types.Mixed)[];
                default: undefined;
            };
            defaultValue: {
                type: typeof mongoose.Schema.Types.Mixed;
            };
            validation: {
                type: {
                    min: {
                        type: NumberConstructor;
                    };
                    max: {
                        type: NumberConstructor;
                    };
                    pattern: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
            showIf: {
                type: {
                    field: {
                        type: StringConstructor;
                    };
                    equals: {
                        type: StringConstructor;
                    };
                };
                default: {};
            };
        }[];
        default: {};
    };
    balance: number;
    currency: string;
    services: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    categories: mongoose.Types.DocumentArray<{
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }, {}, {}> & {
        cast?: any;
        checkRequired?: any;
        set?: any;
        get?: any;
        setters: mongoose.Types.DocumentArray<{}, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {}, {}, {}> & {}>;
        schemaName?: 'Mixed';
        defaultOptions: Record<string, any>;
        prototype?: any;
    }>;
    totalServices: number;
    syncedServices: number;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default _default;
//# sourceMappingURL=SmmSettings.d.ts.map
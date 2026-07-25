import mongoose from 'mongoose';
const smmSettingsSchema = new mongoose.Schema({
    markupPercent: {
        type: Number,
        default: 20,
        min: 0,
        max: 1000,
    },
    lastSyncAt: {
        type: Date,
        default: null,
    },
    lastSyncCount: {
        type: Number,
        default: 0,
    },
    syncStatus: {
        type: String,
        enum: ['idle', 'syncing', 'success', 'error'],
        default: 'idle',
    },
    lastErrorMessage: {
        type: String,
        default: '',
    },
    defaultCategory: {
        type: String,
        default: 'Social Media',
    },
    autoSyncEnabled: {
        type: Boolean,
        default: false,
    },
    categoryOverrides: {
        type: Map,
        of: String,
        default: {},
    },
    enabledCategories: {
        type: [String],
        default: ['Facebook', 'YouTube', 'Free Fire', 'TikTok'],
    },
    platformImages: {
        type: Map,
        of: String,
        default: {},
    },
    categoryOrderFields: {
        type: Map,
        of: [{
                key: { type: String, required: true },
                label: { type: String, required: true },
                type: {
                    type: String,
                    enum: ['text', 'textarea', 'number', 'url', 'email', 'select', 'radio', 'checkbox', 'date', 'time', 'password', 'hidden'],
                    default: 'text',
                },
                placeholder: { type: String },
                required: { type: Boolean, default: false },
                options: { type: [mongoose.Schema.Types.Mixed], default: undefined },
                defaultValue: { type: mongoose.Schema.Types.Mixed },
                validation: {
                    type: {
                        min: { type: Number },
                        max: { type: Number },
                        pattern: { type: String },
                    },
                    default: {},
                },
                showIf: {
                    type: {
                        field: { type: String },
                        equals: { type: String },
                    },
                    default: {},
                },
            }],
        default: {},
    },
    balance: {
        type: Number,
        default: 0,
    },
    currency: {
        type: String,
        default: 'BDT',
    },
    services: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
    },
    categories: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
    },
    totalServices: {
        type: Number,
        default: 0,
    },
    syncedServices: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
// Delete cached model in dev hot-reload
if (mongoose.models.SmmSettings) {
    delete mongoose.models.SmmSettings;
}
export default mongoose.model('SmmSettings', smmSettingsSchema);
//# sourceMappingURL=SmmSettings.js.map
import mongoose, { Document, Schema } from 'mongoose';
const SideSliderSettingsSchema = new Schema({
    navigation: [
        {
            name: { type: String, required: true },
            slug: { type: String, required: true },
            icon: { type: String, required: true },
            badge: { type: String },
            color: { type: String, required: true },
            description: { type: String, required: true },
            enabled: { type: Boolean, default: true },
            order: { type: Number, default: 0 },
        },
    ],
    liveActivity: {
        enabled: { type: Boolean, default: true },
        orders: [
            {
                user: { type: String, required: true },
                service: { type: String, required: true },
                time: { type: String, required: true },
                flag: { type: String, required: true },
            },
        ],
    },
    trustBadges: {
        safe: {
            enabled: { type: Boolean, default: true },
            icon: { type: String, default: 'shield' },
            label: { type: String, default: 'Safe' },
            color: { type: String, default: 'green' },
        },
        fast: {
            enabled: { type: Boolean, default: true },
            icon: { type: String, default: 'zap' },
            label: { type: String, default: 'Fast' },
            color: { type: String, default: 'orange' },
        },
    },
    premiumServices: {
        enabled: { type: Boolean, default: true },
        logo: { type: String, default: '/zi-logo.svg' },
        title: { type: String, default: 'ZI PREMIUM SERVICES' },
        subtitle: { type: String, default: 'Your Digital Gateway' },
    },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });
export default mongoose.models.SideSliderSettings ||
    mongoose.model('SideSliderSettings', SideSliderSettingsSchema);
//# sourceMappingURL=SideSliderSettings.js.map
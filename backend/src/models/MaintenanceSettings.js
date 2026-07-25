import mongoose, { Model, HydratedDocument } from 'mongoose';
const MaintenanceSettingsSchema = new mongoose.Schema({
    enabled: {
        type: Boolean,
        default: false,
        required: true
    },
    type: {
        type: String,
        enum: ['marquee', 'fullscreen'],
        default: 'marquee',
        required: true
    },
    message: {
        type: String,
        default: '',
        trim: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
// Ensure only one maintenance settings document exists
MaintenanceSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({
            enabled: false,
            type: 'marquee',
            message: ''
        });
    }
    return settings;
};
export default mongoose.models.MaintenanceSettings || mongoose.model('MaintenanceSettings', MaintenanceSettingsSchema);
//# sourceMappingURL=MaintenanceSettings.js.map
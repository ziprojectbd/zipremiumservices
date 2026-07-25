import mongoose, { Document, Schema } from 'mongoose';
const PopupSettingsSchema = new Schema({
    enabled: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    timestamps: true
});
export default mongoose.models.PopupSettings || mongoose.model('PopupSettings', PopupSettingsSchema);
//# sourceMappingURL=PopupSettings.js.map
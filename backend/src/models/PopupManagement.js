import mongoose, { Document, Schema } from 'mongoose';
const PopupManagementSchema = new Schema({
    imageUrl: {
        type: String,
        required: true,
        trim: true
    },
    altText: {
        type: String,
        required: true,
        trim: true,
        default: 'Popup Image'
    },
    offerUrl: {
        type: String,
        trim: true
    },
    showDuration: {
        type: Number,
        required: true,
        default: 3,
        min: 1,
        max: 60
    },
    order: {
        type: Number,
        required: true,
        default: 0
    },
    type: {
        type: String,
        enum: ['image', 'lottie'],
        default: 'image'
    }
}, {
    timestamps: true
});
// Index for ordering
PopupManagementSchema.index({ order: 1 });
export default mongoose.models.PopupManagement || mongoose.model('PopupManagement', PopupManagementSchema);
//# sourceMappingURL=PopupManagement.js.map
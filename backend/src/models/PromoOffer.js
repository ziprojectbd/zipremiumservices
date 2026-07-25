import mongoose, { Document, Schema } from 'mongoose';
const PromoOfferSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    imageUrl: {
        type: String,
        required: true,
        trim: true,
    },
    order: {
        type: Number,
        default: 0,
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    link: {
        type: String,
        trim: true,
    },
    type: {
        type: String,
        enum: ['image', 'lottie'],
        default: 'image',
    },
}, {
    timestamps: true,
});
// Index for sorting by order
PromoOfferSchema.index({ order: 1 });
export default mongoose.models.PromoOffer || mongoose.model('PromoOffer', PromoOfferSchema);
//# sourceMappingURL=PromoOffer.js.map
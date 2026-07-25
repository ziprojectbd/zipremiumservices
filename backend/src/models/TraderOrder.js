import mongoose from 'mongoose';
const traderOrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
    },
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DigitalAssetListing',
        required: true,
    },
    bidId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TraderBid',
    },
    buyerEmail: {
        type: String,
        required: true,
    },
    buyerName: {
        type: String,
        required: true,
    },
    sellerEmail: {
        type: String,
        required: true,
    },
    sellerName: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        default: '',
    },
    paymentNumber: {
        type: String,
        default: '',
    },
    transactionId: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'paid', 'completed', 'cancelled', 'disputed'],
        default: 'pending',
    },
    notes: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});
traderOrderSchema.index({ listingId: 1 });
traderOrderSchema.index({ buyerEmail: 1 });
traderOrderSchema.index({ sellerEmail: 1 });
traderOrderSchema.index({ status: 1 });
if (mongoose.models.TraderOrder) {
    delete mongoose.models.TraderOrder;
}
export default mongoose.model('TraderOrder', traderOrderSchema);
//# sourceMappingURL=TraderOrder.js.map
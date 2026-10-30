import mongoose from 'mongoose';

const traderBidSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DigitalAssetListing',
    required: true,
  },
  bidderEmail: {
    type: String,
    required: true,
  },
  bidderName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

traderBidSchema.index({ listingId: 1 });
traderBidSchema.index({ bidderEmail: 1 });
traderBidSchema.index({ status: 1 });

if (mongoose.models.TraderBid) {
  delete mongoose.models.TraderBid;
}

export default mongoose.model('TraderBid', traderBidSchema);

import mongoose from 'mongoose';
const userProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'BDT',
        trim: true,
    },
    condition: {
        type: String,
        enum: ['new', 'used', 'refurbished'],
        default: 'new',
    },
    count: {
        type: Number,
        default: 1,
        min: 1,
    },
    paymentMethod: {
        type: String,
        required: true,
        trim: true,
    },
    paymentDetails: {
        type: String,
        required: true,
        trim: true,
    },
    images: {
        type: [String],
        default: [],
    },
    contactEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    contactPhone: {
        type: String,
        required: true,
        trim: true,
    },
    location: {
        type: String,
        trim: true,
        default: '',
    },
    userName: {
        type: String,
        trim: true,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true,
    },
    adminNotice: {
        type: String,
        trim: true,
        default: '',
    },
    statusUpdatedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
userProductSchema.index({ contactEmail: 1 });
userProductSchema.index({ status: 1, createdAt: -1 });
const UserProduct = mongoose.models.UserProduct ||
    mongoose.model('UserProduct', userProductSchema);
export default UserProduct;
//# sourceMappingURL=UserProduct.js.map
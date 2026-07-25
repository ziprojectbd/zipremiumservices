import mongoose from 'mongoose';
const TraderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
    },
    nidNumber: {
        type: String,
        required: [true, 'NID number is required'],
        trim: true,
    },
    dateOfBirth: {
        type: String,
        required: [true, 'Date of birth is required'],
    },
    district: {
        type: String,
        required: [true, 'District is required'],
        trim: true,
    },
    upazila: {
        type: String,
        required: [true, 'Upazila is required'],
        trim: true,
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
    },
    postCode: {
        type: String,
        required: [true, 'Post code is required'],
        trim: true,
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
    },
    idCardFrontImage: {
        type: String,
        required: [true, 'ID card front image is required'],
    },
    idCardBackImage: {
        type: String,
        required: [true, 'ID card back image is required'],
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
}, {
    timestamps: true
});
const Trader = mongoose.models.Trader || mongoose.model('Trader', TraderSchema);
export default Trader;
//# sourceMappingURL=Trader.js.map
import mongoose from 'mongoose';
const captchaApiKeySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    key: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active',
    },
    lastUsed: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
const CaptchaApiKey = mongoose.models.CaptchaApiKey ||
    mongoose.model('CaptchaApiKey', captchaApiKeySchema);
export default CaptchaApiKey;
//# sourceMappingURL=CaptchaApiKey.js.map
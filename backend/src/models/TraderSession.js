import mongoose from 'mongoose';
const TraderSessionSchema = new mongoose.Schema({
    traderEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
// Auto-delete expired sessions
TraderSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const TraderSession = mongoose.models.TraderSession || mongoose.model('TraderSession', TraderSessionSchema);
export default TraderSession;
//# sourceMappingURL=TraderSession.js.map
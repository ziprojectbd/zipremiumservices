import mongoose from 'mongoose';
const DigitalAssetListingSchema = new mongoose.Schema({
    traderEmail: {
        type: String,
        required: true,
        lowercase: true,
    },
    traderName: {
        type: String,
        required: true,
    },
    assetType: {
        type: String,
        required: true,
        enum: ['youtube', 'facebook-page', 'facebook-group', 'instagram', 'pubg', 'freefire'],
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    price: {
        type: Number,
        required: true,
    },
    negotiable: {
        type: Boolean,
        default: true,
    },
    images: [{
            type: String,
        }],
    // YouTube specific fields
    channelSubCategory: {
        type: String,
        default: '',
    },
    subscribers: {
        type: Number,
        default: null,
    },
    monetized: {
        type: String,
        default: 'No',
    },
    channelAgeYears: {
        type: Number,
        default: 0,
    },
    channelAgeMonths: {
        type: Number,
        default: 0,
    },
    channelLink: {
        type: String,
        default: '',
    },
    // Facebook Page specific fields
    pageFollowers: {
        type: Number,
        default: null,
    },
    pageLikes: {
        type: Number,
        default: null,
    },
    pageCategory: {
        type: String,
        default: '',
    },
    pageVerified: {
        type: String,
        default: 'No',
    },
    pageLink: {
        type: String,
        default: '',
    },
    // Facebook Group specific fields
    groupMembers: {
        type: Number,
        default: null,
    },
    groupPrivacy: {
        type: String,
        default: 'Public',
    },
    // Instagram specific fields
    instagramFollowers: {
        type: Number,
        default: null,
    },
    instagramCategory: {
        type: String,
        default: '',
    },
    instagramVerified: {
        type: String,
        default: 'No',
    },
    // PUBG/Free Fire specific fields
    accountRank: {
        type: String,
        default: '',
    },
    accountLevel: {
        type: Number,
        default: null,
    },
    accountUC: {
        type: Number,
        default: null,
    },
    accountSkins: {
        type: Number,
        default: null,
    },
    status: {
        type: String,
        enum: ['active', 'sold', 'removed'],
        default: 'active',
    },
    views: {
        type: Number,
        default: 0,
    },
    saves: {
        type: Number,
        default: 0,
    },
    questions: [{
            question: {
                type: String,
                required: true,
            },
            answer: {
                type: String,
                default: '',
            },
            askedBy: {
                type: String,
                required: true,
            },
            askedAt: {
                type: Date,
                default: Date.now,
            },
            answeredAt: {
                type: Date,
            },
        }],
    bids: [{
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
            createdAt: {
                type: Date,
                default: Date.now,
            },
            status: {
                type: String,
                enum: ['pending', 'accepted', 'rejected'],
                default: 'pending',
            },
            orderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MarketplaceOrder',
            },
        }],
}, {
    timestamps: true,
});
export default mongoose.models.DigitalAssetListing || mongoose.model('DigitalAssetListing', DigitalAssetListingSchema);
//# sourceMappingURL=DigitalAssetListing.js.map